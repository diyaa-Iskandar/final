
// أنواع المستخدمين
export enum UserRole {
  ADMIN = 'ADMIN', // محاسب
  ENGINEER = 'ENGINEER', // مهندس
  TECHNICIAN = 'TECHNICIAN' // فني / مساعد
}

// حالة العهدة
export enum AdvanceStatus {
  PENDING = 'PENDING', // طلب عهدة جديد (جديد)
  OPEN = 'OPEN',       // تمت الموافقة عليها وسارية
  CLOSED = 'CLOSED',   // تم تسويتها وإغلاقها
  REJECTED = 'REJECTED' // تم رفض الطلب (جديد)
}

// حالة المصروف
export enum ExpenseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// حالة المشروع (نظام جديد)
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

// واجهة المستخدم
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  jobTitle?: string;
  managerId?: string;
  rootAdminId?: string;
  preferences?: {
    soundEnabled: boolean;
  };
}

// واجهة المشروع
export interface Project {
  id: string;
  name: string;
  location: string;
  managerId: string;
  status: ProjectStatus; // تم التغيير من isArchived
}

// واجهة العهدة
export interface Advance {
  id: string;
  projectId: string;
  userId: string;
  amount: number;
  remainingAmount: number;
  description: string;
  status: AdvanceStatus;
  date: string;
  rejectionReason?: string;
  
  // حقول التصفية
  settlementData?: {
    totalApprovedExpenses: number;
    returnedCashAmount: number;
    deficitAmount: number;
    settlementDate?: string;
    notes?: string;
  };
}

// عنصر الفاتورة
export interface InvoiceItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// واجهة المصروف
export interface Expense {
  id: string;
  advanceId: string;
  userId: string;
  amount: number;
  description: string;
  notes?: string;
  imageUrl?: string;
  status: ExpenseStatus;
  date: string;
  rejectionReason?: string;
  
  // التحكم في التعديل
  isEditable?: boolean; // هل يسمح المحاسب بتعديل هذا المصروف بعد الموافقة؟

  // حقول الفاتورة التفصيلية
  isInvoice?: boolean;
  invoiceItems?: InvoiceItem[];
  additionalAmount?: number;
}

// واجهة الإشعارات
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  relatedId?: string;
  targetPage?: string; // الصفحة المستهدفة (dashboard, advances, etc)
  targetId?: string;   // معرف العنصر لفتحه
  createdAt: string;
}
