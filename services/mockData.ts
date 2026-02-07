import { Advance, AdvanceStatus, Expense, ExpenseStatus, Project, User, UserRole } from '../types';

// Helper to get dynamic dates
const getRecentDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// 1. المحاسبين (الجذور)
const ADMIN_1_ID = 'admin_mohsen';
const ADMIN_2_ID = 'admin_sameh';

export const MOCK_USERS: User[] = [
  // المحاسب الأول: محسن بازة
  {
    id: ADMIN_1_ID,
    name: 'Mohsen Baza',
    email: 'Mohsen.baza@petrotec-eng.net',
    password: 'Mohsen12--', 
    role: UserRole.ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=Mohsen+Baza&background=0D8ABC&color=fff',
    phone: '01000000001',
    jobTitle: 'Senior Accountant',
    managerId: undefined, 
    rootAdminId: ADMIN_1_ID,
    preferences: { soundEnabled: true }
  },
  // المحاسب الثاني: سامح الجندي
  {
    id: ADMIN_2_ID,
    name: 'Sameh Elgendy',
    email: 'sameh.elgendy@petrotec-eng.net',
    password: 'Sameh12--',
    role: UserRole.ADMIN,
    avatarUrl: 'https://ui-avatars.com/api/?name=Sameh+Elgendy&background=6366f1&color=fff',
    phone: '01000000002',
    jobTitle: 'Senior Accountant',
    managerId: undefined,
    rootAdminId: ADMIN_2_ID,
    preferences: { soundEnabled: true }
  },
  // مهندس تابع لمحسن
  {
    id: 'eng_ahmed',
    name: 'م. أحمد علي',
    email: 'ahmed@petrotec.com',
    password: '123',
    role: UserRole.ENGINEER,
    avatarUrl: 'https://ui-avatars.com/api/?name=Ahmed+Ali',
    phone: '01222222222',
    jobTitle: 'Site Engineer',
    managerId: ADMIN_1_ID,
    rootAdminId: ADMIN_1_ID,
    preferences: { soundEnabled: true }
  },
   // فني تابع للمهندس أحمد (تحت إدارة محسن)
   {
    id: 'tech_sayed',
    name: 'سيد الفني',
    email: 'sayed@petrotec.com',
    password: '123',
    role: UserRole.TECHNICIAN,
    avatarUrl: 'https://ui-avatars.com/api/?name=Sayed',
    phone: '01111111111',
    jobTitle: 'Electrical Technician',
    managerId: 'eng_ahmed',
    rootAdminId: ADMIN_1_ID,
    preferences: { soundEnabled: true }
  }
];

// 2. المشاريع
export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    name: 'مشروع صيانة البرج',
    location: 'القاهرة',
    managerId: ADMIN_1_ID, // خاص بمحسن
    status: 'ACTIVE',
  },
  {
    id: 'proj_2',
    name: 'محطة مياه الجبيل',
    location: 'الاسكندرية',
    managerId: ADMIN_2_ID, // خاص بسامح
    status: 'ACTIVE',
  }
];

// 3. العهد (تواريخ حديثة)
export const MOCK_ADVANCES: Advance[] = [
  {
    id: 'adv_1',
    projectId: 'proj_1',
    userId: 'eng_ahmed',
    amount: 10000,
    remainingAmount: 8500,
    description: 'عهدة خامات أولية',
    status: AdvanceStatus.OPEN,
    date: getRecentDate(10),
  },
  {
    id: 'adv_2',
    projectId: 'proj_1',
    userId: 'tech_sayed',
    amount: 2000,
    remainingAmount: 2000,
    description: 'عهدة انتقال',
    status: AdvanceStatus.PENDING, // عهدة معلقة
    date: getRecentDate(2),
  },
  {
    id: 'adv_3',
    projectId: 'proj_2',
    userId: 'eng_ahmed',
    amount: 5000,
    remainingAmount: 5000,
    description: 'عهدة أدوات مكتبية',
    status: AdvanceStatus.PENDING, 
    date: getRecentDate(1),
  }
];

// 4. المصروفات (تواريخ حديثة لظهور الرسم البياني)
export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    advanceId: 'adv_1',
    userId: 'eng_ahmed',
    amount: 1500,
    description: 'شراء كابلات',
    notes: 'تم الشراء من المورد المعتمد',
    status: ExpenseStatus.APPROVED,
    date: getRecentDate(5),
    imageUrl: 'https://picsum.photos/400/300',
  },
  {
    id: 'exp_2',
    advanceId: 'adv_1',
    userId: 'eng_ahmed',
    amount: 500,
    description: 'وجبة غداء للفريق',
    status: ExpenseStatus.PENDING, 
    date: getRecentDate(1),
  },
  // بيانات قديمة للشهر السابق (للرسم البياني)
  {
    id: 'exp_3',
    advanceId: 'adv_1',
    userId: 'eng_ahmed',
    amount: 3000,
    description: 'توريد أسمنت',
    status: ExpenseStatus.APPROVED,
    date: getRecentDate(35), 
  },
  {
    id: 'exp_4',
    advanceId: 'adv_1',
    userId: 'eng_ahmed',
    amount: 2500,
    description: 'نقل ومعدات',
    status: ExpenseStatus.APPROVED,
    date: getRecentDate(65), 
  }
];
