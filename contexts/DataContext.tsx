
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Advance, Expense, Project, User, ExpenseStatus, AdvanceStatus, UserRole, AppNotification } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface DataContextType {
  users: User[];
  projects: Project[];
  advances: Advance[];
  expenses: Expense[];
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  
  // بيانات التوجيه العالمية (لفتح المودال من أي مكان)
  redirectTarget: { page: string; itemId?: string; itemType?: 'ADVANCE' | 'EXPENSE' } | null;
  clearRedirectTarget: () => void;
  setRedirect: (page: string, itemId: string, itemType: 'ADVANCE' | 'EXPENSE') => void;

  addProject: (project: Omit<Project, 'id' | 'status'>) => Promise<void>;
  archiveProject: (projectId: string) => Promise<boolean>; 
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  
  addAdvance: (advance: Omit<Advance, 'id' | 'status' | 'remainingAmount' | 'date'>) => Promise<void>;
  editAdvance: (id: string, updates: Partial<Advance>) => Promise<void>;
  
  addExpense: (expense: Omit<Expense, 'id' | 'status' | 'rejectionReason'>) => Promise<void>;
  editExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  
  updateExpenseStatus: (expenseId: string, status: ExpenseStatus, reason?: string) => Promise<void>;
  toggleExpenseEditability: (expenseId: string, isEditable: boolean) => Promise<void>;
  
  updateAdvanceStatus: (advanceId: string, status: AdvanceStatus, reason?: string) => Promise<void>;
  closeAdvance: (advanceId: string, settlementData: any) => Promise<void>;
  
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  getMyTeam: () => User[];
  getMyProjects: () => Project[];
  getStableAvatar: (name: string) => string; 
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification(); 
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allAdvances, setAllAdvances] = useState<Advance[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [redirectTarget, setRedirectTarget] = useState<{ page: string; itemId?: string; itemType?: 'ADVANCE' | 'EXPENSE' } | null>(null);
  
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  const fetchData = async () => {
    try {
        // 1. Fetch Users
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) setAllUsers(usersData);

        // 2. Fetch Projects
        const { data: projectsData } = await supabase.from('projects').select('*');
        if (projectsData) setAllProjects(projectsData);

        // 3. Fetch Advances
        const { data: advancesData } = await supabase.from('advances').select('*');
        if (advancesData) setAllAdvances(advancesData);

        // 4. Fetch Expenses
        const { data: expensesData } = await supabase.from('expenses').select('*');
        if (expensesData) setAllExpenses(expensesData);

        // 5. Fetch Notifications (Only for current user)
        if (currentUser) {
            const { data: notifData } = await supabase
                .from('notifications')
                .select('*')
                .eq('userId', currentUser.id)
                .order('createdAt', { ascending: false });
            if (notifData) setNotifications(notifData);
        }

    } catch (error) {
        console.error('Error fetching data:', error);
    }
  };

  // --- Realtime Listener Setup ---
  useEffect(() => {
      fetchData();

      // Subscribe to changes in public schema
      const channel = supabase.channel('app-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
          
          // Always refresh data to ensure consistency across clients
          fetchData();

          // Notification Logic (Sound & Toast)
          if (payload.table === 'notifications' && payload.eventType === 'INSERT') {
              const newNotif = payload.new as AppNotification;
              // Only alert if the notification is meant for THIS logged-in user
              if (newNotif.userId === currentUser?.id) {
                  playNotificationSound();
                  showNotification(newNotif.message, newNotif.type as any);
              }
          }
      })
      .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]); // Re-subscribe only if user ID changes

  const playNotificationSound = () => {
    if (currentUser?.preferences?.soundEnabled !== false) {
      notificationSound.current.currentTime = 0;
      notificationSound.current.play().catch(e => console.log('Audio play blocked (needs interaction)', e));
    }
  };

  const clearRedirectTarget = () => setRedirectTarget(null);
  const setRedirect = (page: string, itemId: string, itemType: 'ADVANCE' | 'EXPENSE') => {
      setRedirectTarget({ page, itemId, itemType });
  };

  // --- Strict Visibility Logic (المنطق الصارم للرؤية) ---
  
  // 1. Projects:
  // - Admin: Sees projects they manage directly.
  // - Engineer/Tech: Sees projects they are assigned to (via advances or assignment logic - here simplified to all active projects they have data in or are open).
  // *Correction*: Engineers usually work on specific projects. If no explicit assignment table exists, we assume they see projects created by their Root Admin.
  const filteredProjects = allProjects.filter(p => {
    if (!currentUser) return false;
    // Admin sees their own projects
    if (currentUser.role === UserRole.ADMIN) {
        return p.managerId === currentUser.id;
    }
    // Others see projects managed by their Root Admin
    return p.managerId === currentUser.rootAdminId;
  });

  // 2. Users (Team):
  // - Admin: Sees all users under their RootAdminId.
  // - Engineer: Sees ONLY technicians reporting to them (`managerId === currentUser.id`).
  // - Technician: Sees no one (or just themselves in contexts requiring a list).
  const filteredUsers = allUsers.filter(u => {
      if (!currentUser) return false;
      if (u.id === currentUser.id) return true; // Always include self

      if (currentUser.role === UserRole.ADMIN) {
          return u.rootAdminId === currentUser.id;
      }
      if (currentUser.role === UserRole.ENGINEER) {
          return u.managerId === currentUser.id; // Only my technicians
      }
      return false; // Technicians see no one else
  });

  // 3. Advances (The Core Logic Change):
  const filteredAdvances = allAdvances.filter(a => {
      if (!currentUser) return false;

      // Ensure the advance belongs to a visible project first
      const projectIsVisible = filteredProjects.some(p => p.id === a.projectId);
      if (!projectIsVisible) return false;

      // Admin: See EVERYTHING in their projects
      if (currentUser.role === UserRole.ADMIN) {
          return true;
      }

      // Engineer: See OWN advances + TECHNICIANS directly under them
      if (currentUser.role === UserRole.ENGINEER) {
          if (a.userId === currentUser.id) return true; // My advance
          
          // Check if the advance owner is a technician managed by me
          const advanceOwner = allUsers.find(u => u.id === a.userId);
          return advanceOwner?.managerId === currentUser.id;
      }

      // Technician: See OWN advances ONLY
      if (currentUser.role === UserRole.TECHNICIAN) {
          return a.userId === currentUser.id;
      }

      return false;
  });
  
  // 4. Expenses: Filtered by visible advances
  const visibleAdvanceIds = filteredAdvances.map(a => a.id);
  const filteredExpenses = allExpenses.filter(e => visibleAdvanceIds.includes(e.advanceId));
  
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const getStableAvatar = (name: string) => {
    if (!name) return `https://ui-avatars.com/api/?name=NA&background=000&color=fff`;
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    const color = "00000".substring(0, 6 - c.length) + c;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&bold=true&size=128`;
  };

  // --- Actions ---

  const addProject = async (data: Omit<Project, 'id' | 'status'>) => {
    const managerId = currentUser?.role === UserRole.ADMIN ? currentUser.id : currentUser?.rootAdminId;
    const { error } = await supabase.from('projects').insert([{ ...data, managerId, status: 'ACTIVE' }]);
    if (error) { showNotification('فشل إضافة المشروع', 'error'); } 
    else { showNotification('تم إضافة المشروع بنجاح', 'success'); fetchData(); }
  };

  const archiveProject = async (projectId: string): Promise<boolean> => {
    const { error } = await supabase.from('projects').update({ status: 'ARCHIVED' }).eq('id', projectId);
    if (error) { showNotification('فشل أرشفة المشروع', 'error'); return false; }
    showNotification('تم نقل المشروع للأرشيف', 'success'); fetchData(); return true;
  };

  const addUser = async (data: Omit<User, 'id'>) => {
    const avatarUrl = getStableAvatar(data.name);
    // Important: Engineer sets themselves as managerId for Technicians
    const managerId = currentUser?.role === UserRole.ENGINEER ? currentUser.id : data.managerId;
    const rootAdminId = currentUser?.role === UserRole.ADMIN ? currentUser.id : currentUser?.rootAdminId;
    
    const { error } = await supabase.from('users').insert([{ ...data, avatarUrl, managerId, rootAdminId }]);
    if (error) { showNotification('فشل إضافة المستخدم', 'error'); } 
    else { showNotification('تم إضافة المستخدم بنجاح', 'success'); fetchData(); }
  };

  const deleteUser = async (userId: string) => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) showNotification('فشل الحذف', 'error');
    else { showNotification('تم الحذف بنجاح', 'success'); fetchData(); }
  };

  const addAdvance = async (data: Omit<Advance, 'id' | 'status' | 'remainingAmount' | 'date'>) => {
    // If Admin creates it -> OPEN immediately. If Engineer/Tech -> PENDING
    // Exception: Engineer approving a Tech advance (handled in Dashboard logic, but here creating NEW)
    // Logic: Users create requests for themselves generally. 
    // If Admin creates for someone else, it's OPEN.
    
    const isSelf = data.userId === currentUser?.id;
    let initialStatus = AdvanceStatus.PENDING;

    if (currentUser?.role === UserRole.ADMIN) {
        initialStatus = AdvanceStatus.OPEN;
    } 
    // Engineer creating for Technician (Direct approval)
    else if (currentUser?.role === UserRole.ENGINEER && !isSelf) {
         // Check if user is my technician
         const targetUser = allUsers.find(u => u.id === data.userId);
         if (targetUser?.managerId === currentUser.id) {
             initialStatus = AdvanceStatus.OPEN; // Engineer funds their tech directly (if logic allows)
             // Usually Engineer requests for themselves, or Tech requests.
             // If Engineer requests, it goes to Admin (Pending).
         }
    }

    const { error } = await supabase.from('advances').insert([{
      ...data,
      status: initialStatus,
      remainingAmount: Number(data.amount),
      date: new Date().toISOString().split('T')[0]
    }]);
    if (error) showNotification('فشل العملية', 'error');
    else { 
        showNotification('تمت العملية بنجاح', 'success'); 
        fetchData(); 
    }
  };

  const editAdvance = async (id: string, updates: Partial<Advance>) => {
    const { error } = await supabase.from('advances').update(updates).eq('id', id);
    if (error) showNotification('فشل التعديل', 'error');
    else { showNotification('تم التعديل بنجاح', 'success'); fetchData(); }
  };

  const addExpense = async (data: Omit<Expense, 'id' | 'status' | 'rejectionReason'>) => {
    const { error } = await supabase.from('expenses').insert([{
      ...data,
      date: new Date().toISOString().split('T')[0],
      status: ExpenseStatus.PENDING
    }]);
    if (error) showNotification('فشل التسجيل', 'error');
    else { 
        showNotification('تم التسجيل بنجاح', 'success'); 
        playNotificationSound(); 
        fetchData(); 
    }
  };

  const editExpense = async (id: string, updates: Partial<Expense>) => {
    const { error } = await supabase.from('expenses').update(updates).eq('id', id);
    if (error) showNotification('فشل التعديل', 'error');
    else { showNotification('تم التعديل بنجاح', 'success'); fetchData(); }
  };

  const updateExpenseStatus = async (expenseId: string, status: ExpenseStatus, reason?: string) => {
    const { error } = await supabase.from('expenses').update({ status, rejectionReason: reason, isEditable: false }).eq('id', expenseId);
    if (!error) {
        if (status === ExpenseStatus.APPROVED) {
            const expense = allExpenses.find(e => e.id === expenseId);
            const advance = allAdvances.find(a => a.id === expense?.advanceId);
            if (expense && advance) {
                const newRemaining = Number(advance.remainingAmount) - Number(expense.amount);
                await supabase.from('advances').update({ remainingAmount: newRemaining }).eq('id', advance.id);
            }
        }
        fetchData(); // Trigger update immediately
    }
  };

  const toggleExpenseEditability = async (expenseId: string, isEditable: boolean) => {
      await supabase.from('expenses').update({ isEditable }).eq('id', expenseId);
      showNotification(isEditable ? 'تم فتح التعديل' : 'تم قفل التعديل', 'info');
      fetchData();
  };

  const updateAdvanceStatus = async (advanceId: string, status: AdvanceStatus, reason?: string) => {
      await supabase.from('advances').update({ status, rejectionReason: reason }).eq('id', advanceId);
      fetchData(); // Trigger update immediately
  };

  const closeAdvance = async (advanceId: string, settlementData: any) => {
      const { error } = await supabase.from('advances').update({ status: AdvanceStatus.CLOSED, settlementData }).eq('id', advanceId);
      if (!error) {
          // If there is deficit, maybe create a new debt advance? 
          // Keeping logic simple: just close it.
          const oldAdvance = allAdvances.find(a => a.id === advanceId);
          if (oldAdvance && settlementData.deficitAmount > 0) {
              const newDeficitAdvance = {
                  projectId: oldAdvance.projectId,
                  userId: oldAdvance.userId,
                  amount: Number(settlementData.deficitAmount),
                  remainingAmount: Number(settlementData.deficitAmount),
                  description: `تسوية عجز: ${oldAdvance.description}`,
                  status: AdvanceStatus.OPEN, // Auto open as debt
                  date: new Date().toISOString().split('T')[0]
              };
              await supabase.from('advances').insert([newDeficitAdvance]);
              showNotification('تم ترحيل العجز لعهدة جديدة', 'warning');
          }
          fetchData();
      }
  };

  const markNotificationAsRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      await supabase.from('notifications').update({ isRead: true }).eq('id', id);
  };

  const markAllNotificationsAsRead = async () => {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (currentUser) {
          await supabase.from('notifications').update({ isRead: true }).eq('userId', currentUser.id);
      }
  };

  return (
    <DataContext.Provider value={{
      users: filteredUsers.filter(u => u.id !== currentUser?.id), // Remove self from list views
      projects: filteredProjects,
      advances: filteredAdvances,
      expenses: filteredExpenses,
      notifications,
      unreadNotificationsCount,
      redirectTarget,
      clearRedirectTarget,
      setRedirect,
      addProject,
      archiveProject,
      addUser,
      deleteUser,
      addAdvance,
      editAdvance,
      addExpense,
      editExpense,
      updateExpenseStatus,
      toggleExpenseEditability,
      updateAdvanceStatus,
      closeAdvance,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      getMyTeam: () => filteredUsers.filter(u => u.id !== currentUser?.id),
      getMyProjects: () => filteredProjects,
      getStableAvatar
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};
