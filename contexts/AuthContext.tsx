
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';
import { useNotification } from './NotificationContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    // محاولة استرجاع المستخدم من التخزين المحلي عند البدء
    const savedUser = localStorage.getItem('petrotec_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Check immediately if this user was deleted locally before rendering
      if (!parsedUser.isDeleted) {
          setUser(parsedUser);
      } else {
          localStorage.removeItem('petrotec_user');
      }
    }
  }, []);

  // --- Realtime Security Check: Force Logout if Deleted ---
  useEffect(() => {
      if (!user) return;

      const channel = supabase.channel(`auth_security_${user.id}`)
      .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
          (payload) => {
              const updatedUser = payload.new as User;
              if (updatedUser.isDeleted) {
                  logout();
                  showNotification('تم إيقاف/حذف حسابك من قبل الإدارة.', 'error');
              }
          }
      )
      .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      // البحث عن المستخدم في جدول users
      // هام: التأكد أنه غير محذوف
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', pass)
        .eq('isDeleted', false) 
        .single();

      if (error || !data) {
        console.error('Login error:', error);
        return false;
      }

      const loggedUser: User = data as User;
      setUser(loggedUser);
      localStorage.setItem('petrotec_user', JSON.stringify(loggedUser));
      return true;
    } catch (err) {
      console.error('Login exception:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('petrotec_user');
  };

  const updateProfile = async (data: Partial<User>) => {
    if (user) {
      try {
        const { error } = await supabase
          .from('users')
          .update(data)
          .eq('id', user.id);

        if (error) throw error;

        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('petrotec_user', JSON.stringify(updatedUser));
        showNotification('تم تحديث الملف الشخصي بنجاح', 'success');
      } catch (err) {
        console.error('Profile update failed:', err);
        showNotification('فشل تحديث الملف الشخصي', 'error');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
