
import React, { useMemo, useState, useEffect } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Plus, X, Filter, Wallet, Calendar, User, FileText, Image as ImageIcon, Briefcase, StickyNote, Edit, FileSpreadsheet, FileCheck, DollarSign, AlertOctagon } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { AdvanceStatus, UserRole, Advance, Expense, ExpenseStatus } from '../types';
import * as XLSX from 'xlsx';

export const Advances: React.FC = () => {
  const { t } = useLanguage();
  const { advances, addAdvance, editAdvance, getMyTeam, projects, expenses, users, getStableAvatar, redirectTarget, clearRedirectTarget } = useData();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); 
  
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [editingAdvanceId, setEditingAdvanceId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filterProject, setFilterProject] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | AdvanceStatus>(AdvanceStatus.OPEN);

  useEffect(() => {
    // Check if there's a pending redirection from notifications
    if (redirectTarget && redirectTarget.page === 'advances' && redirectTarget.itemId) {
        if (redirectTarget.itemType === 'ADVANCE') {
            const targetAdv = advances.find(a => a.id === redirectTarget.itemId);
            if (targetAdv) {
                setSelectedAdvance(targetAdv);
                clearRedirectTarget(); // Consumed
            }
        }
    }
  }, [redirectTarget, advances]);

  useEffect(() => {
    const isAnyModalOpen = showAddModal || showEditModal || !!selectedAdvance || !!selectedExpense || !!previewImage;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showAddModal, showEditModal, selectedAdvance, selectedExpense, previewImage]);

  if (!user) return null;

  const myTeam = getMyTeam();
  const isAdmin = user.role === UserRole.ADMIN;
  const canCreate = isAdmin || myTeam.length > 0;

  const filteredAdvances = useMemo(() => {
      let list = advances;
      if (filterProject !== 'ALL') list = list.filter(a => a.projectId === filterProject);
      if (filterStatus !== 'ALL') list = list.filter(a => a.status === filterStatus);
      return list;
  }, [advances, filterProject, filterStatus]);

  const selectedAdvanceDetails = useMemo(() => {
      if (!selectedAdvance) return null;
      const advExpenses = expenses.filter(e => e.advanceId === selectedAdvance.id);
      const project = projects.find(p => p.id === selectedAdvance.projectId);
      const advUser = users.find(u => u.id === selectedAdvance.userId);
      const totalSpent = advExpenses.filter(e => e.status === ExpenseStatus.APPROVED).reduce((sum, e) => sum + e.amount, 0);

      let deficit = 0;
      let returned = 0;
      let settlementNotes = '';
      if (selectedAdvance.settlementData) {
          deficit = (selectedAdvance.settlementData as any).deficitAmount || (selectedAdvance.settlementData as any).deficit || 0;
          returned = selectedAdvance.settlementData.returnedCashAmount || 0;
          settlementNotes = selectedAdvance.settlementData.notes || '';
      }

      return {
          expenses: advExpenses,
          project,
          user: advUser,
          totalSpent,
          deficit,
          returned,
          settlementNotes
      };
  }, [selectedAdvance, expenses, projects, users]);

  // ... (Rest of functions like exportSingleExpenseSheet, openAddModal, openEditModal, handleSubmit kept same) ...
  const exportSingleExpenseSheet = (expense: Expense) => {
      const adv = advances.find(a => a.id === expense.advanceId);
      const proj = projects.find(p => p.id === adv?.projectId);
      const u = users.find(us => us.id === expense.userId);
      const wb = XLSX.utils.book_new();
      const wsData: any[][] = [
          [{ v: "PETROTEC ENGINEERING", t: "s" }],
          [{ v: "فاتورة مصروف تفصيلية", t: "s" }],
          [],
          ["التاريخ", expense.date, "رقم المصروف", expense.id.substring(0, 8)],
          ["المشروع", proj?.name || "-", "الموظف", u?.name || "-"],
          ["العهدة", adv?.description || "-", "الحالة", t(expense.status === ExpenseStatus.APPROVED ? 'statusApproved' : expense.status === ExpenseStatus.PENDING ? 'statusPending' : 'statusRejected')],
          [],
          ["الوصف الرئيسي", expense.description],
          ["ملاحظات", expense.notes || "-"],
          [],
          ["م", "البند / الصنف", "العدد / الكمية", "سعر الوحدة", "الإجمالي"]
      ];
      if (expense.isInvoice && expense.invoiceItems) {
          expense.invoiceItems.forEach((item, index) => {
              wsData.push([index + 1, item.itemName, item.quantity, item.unitPrice, item.total]);
          });
      } else {
          wsData.push([1, expense.description, 1, expense.amount - (expense.additionalAmount || 0), expense.amount - (expense.additionalAmount || 0)]);
      }
      wsData.push([]);
      if (expense.additionalAmount) {
          wsData.push(["", "", "", "مبالغ إضافية", expense.additionalAmount]);
      }
      wsData.push(["", "", "", "الإجمالي الكلي", expense.amount]);
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, "Invoice Details");
      XLSX.writeFile(wb, `Invoice_${expense.id}_${expense.date}.xlsx`);
  };

  const openAddModal = () => {
      setEditingAdvanceId(null); setSelectedProjectId(''); setSelectedUserId(''); setAmount(''); setDescription(''); setShowAddModal(true);
  };

  const openEditModal = (e: React.MouseEvent, advance: Advance) => {
      e.stopPropagation(); setEditingAdvanceId(advance.id); setSelectedProjectId(advance.projectId); setSelectedUserId(advance.userId); setAmount(advance.amount.toString()); setDescription(advance.description); setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        if (editingAdvanceId) {
            await editAdvance(editingAdvanceId, { amount: parseFloat(amount), description: description });
            setShowEditModal(false);
        } else {
            if (selectedProjectId && selectedUserId && amount && description) {
                await addAdvance({ projectId: selectedProjectId, userId: selectedUserId, amount: parseFloat(amount), description: description });
                setShowAddModal(false);
            }
        }
        setEditingAdvanceId(null); setSelectedProjectId(''); setSelectedUserId(''); setAmount(''); setDescription('');
    } catch (error) { console.error("Error", error); showNotification('حدث خطأ', 'error'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400"><Wallet size={24} /></div>
              {t('advancesList')}
          </h2>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Filter size={18} className="text-slate-400" />
                <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="bg-transparent text-sm font-bold outline-none text-slate-700 dark:text-slate-200 cursor-pointer"><option value="ALL">{t('allProjects')}</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
             </div>
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="bg-transparent text-sm font-bold outline-none text-slate-700 dark:text-slate-200 cursor-pointer">
                    <option value={AdvanceStatus.OPEN}>{t('statusOpen')}</option>
                    <option value={AdvanceStatus.CLOSED}>{t('statusClosed')}</option>
                    <option value="ALL">{t('filterAll')}</option>
                </select>
             </div>
             {canCreate && (<Button onClick={openAddModal} variant="primary" className="shadow-lg shadow-blue-500/20"><Plus size={18} /><span>{t('createAdvance')}</span></Button>)}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredAdvances.map((advance) => {
            const advUser = users.find(u => u.id === advance.userId) || { name: advance.userId, avatarUrl: undefined };
            const project = projects.find(p => p.id === advance.projectId);
            const spentRatio = ((advance.amount - advance.remainingAmount) / advance.amount) * 100;
            const barColor = spentRatio > 90 ? 'bg-red-500' : (spentRatio > 75 ? 'bg-amber-500' : 'bg-blue-500');
            return (
                <div key={advance.id} onClick={() => setSelectedAdvance(advance)} className="group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl dark:hover:shadow-blue-900/10 transition-all duration-300 relative flex flex-col justify-between h-full cursor-pointer overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-100 to-transparent dark:from-slate-700/30 rounded-bl-full opacity-50 pointer-events-none"></div>
                  {isAdmin && (<button onClick={(e) => openEditModal(e, advance)} className="absolute top-4 left-4 p-2 bg-slate-50 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded-lg dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors z-20 shadow-sm" title={t('edit')}><Edit size={16} /></button>)}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-5"><div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800 uppercase tracking-wide">{project?.name}</div><StatusBadge status={advance.status} /></div>
                    <h3 className="font-black text-xl text-slate-800 dark:text-white mb-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{advance.description}</h3>
                    <p className="text-xs font-medium text-slate-400 mb-6 flex items-center gap-1"><Calendar size={12}/> {advance.date}</p>
                    <div className="flex items-center gap-3 mb-6 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <img 
                            src={advUser.avatarUrl || getStableAvatar(advUser.name)} 
                            alt={advUser.name} 
                            className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-500 shadow-sm object-cover" 
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{advUser.name}</span>
                    </div>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <div className="flex justify-between items-end mb-2"><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('totalValue')}</p><p className="font-black text-lg text-slate-800 dark:text-white">{advance.amount.toLocaleString()} <span className="text-xs font-medium text-slate-400">{t('currency')}</span></p></div><div className="text-end"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('remaining')}</p><p className={`font-black text-lg ${advance.remainingAmount < 500 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{advance.remainingAmount.toLocaleString()} <span className="text-xs font-medium opacity-70">{t('currency')}</span></p></div></div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden mb-1 shadow-inner"><div className={`h-full rounded-full transition-all duration-700 ${barColor} shadow-sm`} style={{ width: `${Math.min(spentRatio, 100)}%` }}/></div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1"><span>{t('spentPercentage')}</span><span>{spentRatio.toFixed(0)}%</span></div>
                  </div>
                </div>
            );
          })}
          {filteredAdvances.length === 0 && (<div className="col-span-full py-24 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center"><Wallet size={64} className="mb-4 opacity-30" /><p className="font-bold">لا توجد عهد تطابق الفلتر الحالي</p></div>)}
        </div>
      </div>

      {/* ... (Create/Edit Modal same as before) ... */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scale-in border border-white/10">
            <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-slate-800 dark:text-white">{showEditModal ? 'تعديل العهدة' : t('createAdvance')}</h3><button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800 p-2 rounded-full"><X size={20} /></button></div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{t('selectProject')}</label><div className="relative"><select required value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} disabled={showEditModal || isSubmitting} className="input-modern w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-white font-medium outline-none appearance-none disabled:opacity-50"><option value="">{t('selectProject')}</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="absolute left-3 top-4 pointer-events-none text-slate-400"><Briefcase size={16}/></div></div></div>
              <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{t('selectUser')}</label><div className="relative"><select required value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} disabled={showEditModal || isSubmitting} className="input-modern w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-white font-medium outline-none appearance-none disabled:opacity-50"><option value="">{t('selectUser')}</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><div className="absolute left-3 top-4 pointer-events-none text-slate-400"><User size={16}/></div></div></div>
              <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{t('description')}</label><input required type="text" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} className="input-modern w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-white font-medium outline-none" placeholder="مثال: عهدة نقل ومواصلات" /></div>
              <div><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{t('advanceValue')}</label><input required type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isSubmitting} className="input-modern w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-900 dark:text-white text-2xl font-black outline-none font-mono" placeholder="0" /></div>
              <div className="pt-4"><Button type="submit" isLoading={isSubmitting} className="w-full py-4 text-lg font-bold shadow-xl shadow-blue-500/20">{t('save')}</Button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADVANCE DETAILS (Modern Glass) --- */}
      {selectedAdvance && selectedAdvanceDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] border border-white/10">
                <div className="flex justify-between items-center p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/30"><Wallet size={24} /></div>{selectedAdvance.description}</h3>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm font-medium text-slate-500 dark:text-slate-400"><span className="flex items-center gap-1.5"><Briefcase size={16} className="text-blue-500" /> {selectedAdvanceDetails.project?.name}</span><span className="w-1 h-1 bg-slate-300 rounded-full"></span><span className="flex items-center gap-1.5"><User size={16} className="text-blue-500" /> {selectedAdvanceDetails.user?.name}</span><span className="w-1 h-1 bg-slate-300 rounded-full"></span><span className="flex items-center gap-1.5"><Calendar size={16} className="text-blue-500" /> {selectedAdvance.date}</span></div>
                    </div>
                    <button onClick={() => setSelectedAdvance(null)} className="p-2.5 bg-white dark:bg-slate-800 rounded-full hover:text-red-500 text-slate-400 shadow-md transition-all hover:rotate-90"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* Settlement Info if Closed */}
                    {selectedAdvance.status === AdvanceStatus.CLOSED && (
                        <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">بيانات الإغلاق والتسوية</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                                    <span className="text-sm font-medium text-slate-500">تم التوريد (كاش)</span>
                                    <span className="font-bold text-green-600 text-lg">{selectedAdvanceDetails.returned.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <span className="text-sm font-bold text-red-500 flex items-center gap-2"><AlertOctagon size={16}/> قيمة العجز</span>
                                    <span className="font-black text-red-600 text-lg">{selectedAdvanceDetails.deficit.toLocaleString()}</span>
                                </div>
                            </div>
                            {selectedAdvanceDetails.settlementNotes && (
                                <div className="mt-4 text-sm bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800 text-amber-900 dark:text-amber-100">
                                    <strong>ملاحظات التسوية:</strong> {selectedAdvanceDetails.settlementNotes}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                         <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50 relative overflow-hidden"><div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4"></div><p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-2">قيمة العهدة</p><p className="text-3xl font-black text-slate-800 dark:text-white">{selectedAdvance.amount.toLocaleString()} <small className="text-sm font-bold text-slate-400">{t('currency')}</small></p></div>
                         <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-2xl border border-amber-100 dark:border-amber-800/50 relative overflow-hidden"><div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4"></div><p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest mb-2">المصروف الفعلي</p><p className="text-3xl font-black text-slate-800 dark:text-white">{selectedAdvanceDetails.totalSpent.toLocaleString()} <small className="text-sm font-bold text-slate-400">{t('currency')}</small></p></div>
                         <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 relative overflow-hidden"><div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4"></div><p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mb-2">الرصيد المتبقي</p><p className="text-3xl font-black text-slate-800 dark:text-white">{selectedAdvance.remainingAmount.toLocaleString()} <small className="text-sm font-bold text-slate-400">{t('currency')}</small></p></div>
                    </div>

                    <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3"><div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg"><FileText size={20} className="text-slate-600 dark:text-slate-300"/></div>تفاصيل المصروفات</h4>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <table className="w-full text-start">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <tr><th className="py-4 px-6 text-start">الوصف</th><th className="py-4 px-6 text-start">التاريخ</th><th className="py-4 px-6 text-start">المبلغ</th><th className="py-4 px-6 text-start">الحالة</th><th className="py-4 px-6 text-start">ملاحظات</th><th className="py-4 px-6 text-start">المرفقات</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm bg-white dark:bg-slate-900">
                                {selectedAdvanceDetails.expenses.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-slate-400 italic">لا توجد مصروفات مسجلة على هذه العهدة بعد.</td></tr>
                                ) : (
                                    selectedAdvanceDetails.expenses.map(exp => (
                                        <tr key={exp.id} onClick={() => setSelectedExpense(exp)} className="hover:bg-blue-50/50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                            <td className="py-4 px-6 font-bold text-slate-800 dark:text-white">{exp.description}</td>
                                            <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium">{exp.date}</td>
                                            <td className="py-4 px-6 font-black text-slate-700 dark:text-slate-200">{exp.amount.toLocaleString()}</td>
                                            <td className="py-4 px-6"><StatusBadge status={exp.status} /></td>
                                            <td className="py-4 px-6">{exp.notes ? (<div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md max-w-[150px] truncate text-xs font-medium" title={exp.notes}><StickyNote size={12} className="text-amber-500" /> {exp.notes}</div>) : <span className="text-slate-300">-</span>}</td>
                                            <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>{exp.imageUrl ? (<button onClick={() => setPreviewImage(exp.imageUrl!)} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30 text-xs font-bold transition-colors"><ImageIcon size={14} /> عرض</button>) : <span className="text-slate-300 dark:text-slate-600 text-xs">لا يوجد</span>}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Expense Detail Modal & Image Preview (Keep as is) */}
      {selectedExpense && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] border border-white/10">
                  <div className="flex justify-between items-center p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"><div><h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">تفاصيل المصروف</h3><p className="text-slate-400 text-sm mt-1">رقم المعاملة: #{selectedExpense.id.substring(0,8)}</p></div><button onClick={() => setSelectedExpense(null)} className="p-2.5 bg-white dark:bg-slate-800 rounded-full hover:text-red-500 text-slate-400 shadow-md transition-all hover:rotate-90"><X size={20} /></button></div>
                  <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
                      <div className="text-center"><div className="inline-block p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 mb-4 shadow-inner"><p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">المبلغ الكلي</p><h2 className="text-5xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{selectedExpense.amount.toLocaleString()} <span className="text-2xl text-slate-400 font-medium">{t('currency')}</span></h2></div><h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedExpense.description}</h3><div className="mt-3 flex justify-center scale-110"><StatusBadge status={selectedExpense.status}/></div></div>
                      {selectedExpense.isInvoice && selectedExpense.invoiceItems && (<div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"><div className="p-4 bg-slate-100 dark:bg-slate-800 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700"><FileCheck size={18} className="text-blue-600 dark:text-blue-400" /><span className="text-sm font-bold text-slate-700 dark:text-slate-200">بنود الفاتورة</span></div><div className="p-4 space-y-3">{selectedExpense.invoiceItems.map((item, i) => (<div key={i} className="flex justify-between items-center text-sm border-b border-slate-200/50 dark:border-slate-700/50 last:border-0 pb-3 last:pb-0"><div><p className="font-bold text-slate-700 dark:text-slate-200">{item.itemName}</p><p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.quantity} × {item.unitPrice.toLocaleString()}</p></div><p className="font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm">{item.total.toLocaleString()}</p></div>))}</div>{selectedExpense.additionalAmount && selectedExpense.additionalAmount > 0 && (<div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 flex justify-between items-center text-sm border-t border-blue-100 dark:border-blue-900/30"><span className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold"><DollarSign size={16}/> إضافات</span><span className="font-bold text-blue-700 dark:text-blue-300 text-lg">{selectedExpense.additionalAmount.toLocaleString()}</span></div>)}</div>)}
                      <div className="grid grid-cols-2 gap-4 text-sm"><div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700"><p className="text-slate-400 text-xs font-bold uppercase mb-1">التاريخ</p><p className="font-bold text-slate-700 dark:text-white flex items-center gap-2"><Calendar size={14}/> {selectedExpense.date}</p></div><div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700"><p className="text-slate-400 text-xs font-bold uppercase mb-1">بواسطة</p><p className="font-bold text-slate-700 dark:text-white flex items-center gap-2"><User size={14}/> {users.find(u => u.id === selectedExpense.userId)?.name}</p></div><div className="col-span-2 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30"><p className="text-amber-500 text-xs font-bold uppercase mb-1 flex items-center gap-1"><StickyNote size={12}/> ملاحظات</p><p className="font-medium text-amber-900 dark:text-amber-100 text-sm">{selectedExpense.notes || 'لا توجد ملاحظات إضافية.'}</p></div></div>
                      {selectedExpense.imageUrl ? (<div><p className="text-sm font-bold mb-3 dark:text-white flex items-center gap-2"><ImageIcon size={16}/> المرفقات</p><div onClick={() => setPreviewImage(selectedExpense.imageUrl!)} className="relative h-48 w-full rounded-2xl overflow-hidden cursor-pointer group border-2 border-slate-200 dark:border-slate-700 shadow-sm"><img src={selectedExpense.imageUrl} alt="Receipt" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" /><div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><p className="text-white font-bold flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full"><ImageIcon size={18} /> عرض الصورة</p></div></div></div>) : (<div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 text-center text-slate-400 italic text-sm">لا توجد صورة مرفقة</div>)}
                      <div className="pt-2"><Button onClick={() => exportSingleExpenseSheet(selectedExpense)} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 rounded-xl text-lg font-bold"><FileSpreadsheet size={20} />تصدير فاتورة (Excel)</Button></div>
                  </div>
              </div>
          </div>
      )}
      {previewImage && (<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4 animate-fade-in backdrop-blur-md" onClick={() => setPreviewImage(null)}><div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center"><button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors bg-white/10 p-2 rounded-full"><X size={24}/></button><img src={previewImage} alt="Receipt" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl border border-white/10" /></div></div>)}
    </div>
  );
};
