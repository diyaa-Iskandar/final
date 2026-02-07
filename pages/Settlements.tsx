
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { AdvanceStatus, ExpenseStatus, UserRole } from '../types';
import { CheckCircle, ArrowDownCircle, ArrowUpCircle, Receipt, Printer, X, Calculator, AlertOctagon } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

export const Settlements: React.FC = () => {
  const { t } = useLanguage();
  const { advances, expenses, projects, getMyTeam, closeAdvance, getStableAvatar } = useData();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const myTeam = getMyTeam();
  const [selectedAdvanceId, setSelectedAdvanceId] = useState<string | null>(null);
  const [returnedCash, setReturnedCash] = useState<number>(0);
  const [settlementNotes, setSettlementNotes] = useState('');

  const openAdvances = advances.filter(a => a.status === AdvanceStatus.OPEN);

  const getAdvanceDetails = (id: string) => {
    const advance = advances.find(a => a.id === id);
    if (!advance) return null;
    const relatedExpenses = expenses.filter(e => e.advanceId === id);
    const approvedExpenses = relatedExpenses.filter(e => e.status === ExpenseStatus.APPROVED).reduce((sum, e) => sum + e.amount, 0);
    const theoreticalBalance = advance.amount - approvedExpenses;
    return { advance, approvedExpenses, theoreticalBalance };
  };

  const handleOpenSettlement = (id: string) => {
      const details = getAdvanceDetails(id);
      if(details) {
          setSelectedAdvanceId(id);
          setReturnedCash(0); 
          setSettlementNotes('');
      }
  };

  const handleConfirmSettlement = () => {
      if(!selectedAdvanceId) return;
      const details = getAdvanceDetails(selectedAdvanceId);
      if(!details) return;

      const deficit = details.theoreticalBalance - returnedCash;

      closeAdvance(selectedAdvanceId, {
          totalApprovedExpenses: details.approvedExpenses,
          returnedCashAmount: returnedCash,
          deficitAmount: deficit, 
          notes: settlementNotes,
          settlementDate: new Date().toISOString().split('T')[0]
      });

      showNotification(t('msgAdvanceClosed'), 'success');
      setSelectedAdvanceId(null);
  };

  const renderSettlementModal = () => {
      if(!selectedAdvanceId) return null;
      const details = getAdvanceDetails(selectedAdvanceId);
      if(!details) return null;

      const { advance, approvedExpenses, theoreticalBalance } = details;
      const calculatedDeficit = theoreticalBalance - returnedCash;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Calculator className="text-blue-600 dark:text-blue-400" />
                        {t('settlementTitle')}
                    </h3>
                    <button onClick={() => setSelectedAdvanceId(null)} className="bg-white dark:bg-slate-700 p-1 rounded-full text-slate-400 hover:text-red-500 shadow-sm transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center border border-slate-200 dark:border-slate-700">
                             <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">{t('advanceValue')}</p>
                             <p className="text-xl font-bold text-slate-800 dark:text-white">{advance.amount.toLocaleString()}</p>
                         </div>
                         <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center border border-blue-100 dark:border-blue-800">
                             <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">{t('totalSpent')}</p>
                             <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{approvedExpenses.toLocaleString()}</p>
                         </div>
                    </div>

                    <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{t('theoreticalBalance')}</span>
                        <span className="font-bold text-xl dark:text-white">{theoreticalBalance.toLocaleString()} {t('currency')}</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('enterReturnedCash')}</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={returnedCash} 
                                    onChange={e => setReturnedCash(parseFloat(e.target.value) || 0)}
                                    className="w-full p-4 text-lg border-2 border-green-200 dark:border-green-800/50 rounded-xl focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900/30 focus:border-green-500 outline-none font-bold text-green-700 dark:text-green-400 bg-white dark:bg-slate-900" 
                                />
                                <span className="absolute left-4 top-4 text-green-600 dark:text-green-500 font-bold bg-white dark:bg-slate-900 pl-2">{t('currency')}</span>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl border flex items-center gap-4 ${calculatedDeficit > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300'}`}>
                            {calculatedDeficit > 0 ? <AlertOctagon size={32} /> : <CheckCircle size={32} />}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider">{t('calculatedDeficit')}</p>
                                <p className="text-2xl font-bold">{calculatedDeficit.toLocaleString()} {t('currency')}</p>
                                <p className="text-xs mt-1 opacity-80">
                                    {calculatedDeficit > 0 ? 'هذا المبلغ سيتم تسجيله كعجز على الموظف' : 'تم تسوية العهدة بالكامل'}
                                </p>
                            </div>
                        </div>

                         <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('settlementNotes')}</label>
                            <textarea 
                                value={settlementNotes}
                                onChange={e => setSettlementNotes(e.target.value)}
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white" 
                                placeholder="أي ملاحظات حول العجز أو التسوية..."
                            />
                        </div>
                    </div>

                    <Button onClick={handleConfirmSettlement} className="w-full py-4 text-lg shadow-xl shadow-blue-100 dark:shadow-none">
                        {t('confirmClose')}
                    </Button>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Receipt className="text-blue-600 dark:text-blue-400" />
            {t('settlementTitle')}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {openAdvances.map(advance => {
            const advUser = myTeam.find(u => u.id === advance.userId) || { name: advance.userId, avatarUrl: undefined };
            const project = projects.find(p => p.id === advance.projectId);
            
            const relatedExpenses = expenses.filter(e => e.advanceId === advance.id);
            const totalApproved = relatedExpenses.filter(e => e.status === ExpenseStatus.APPROVED).reduce((sum, e) => sum + e.amount, 0);
            const totalPending = relatedExpenses.filter(e => e.status === ExpenseStatus.PENDING).reduce((sum, e) => sum + e.amount, 0);
            const balance = advance.amount - totalApproved; 

            return (
                <div key={advance.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden relative transition-all hover:shadow-xl group">
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700 border-dashed">
                            <div className="flex items-start gap-4">
                                <img 
                                    src={advUser.avatarUrl || getStableAvatar(advUser.name)}
                                    alt={advUser.name}
                                    className="w-12 h-12 rounded-full border border-blue-100 dark:border-blue-800 object-cover shadow-sm"
                                />
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{advance.description}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                         <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">{project?.name}</span>
                                         <span className="text-xs text-slate-400">{advance.date}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('user')}: <span className="font-semibold text-slate-700 dark:text-slate-200">{advUser.name}</span></p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {user?.role === UserRole.ADMIN && (
                                    <Button variant="danger" onClick={() => handleOpenSettlement(advance.id)}>
                                        <CheckCircle size={16} />
                                        {t('closeAdvance')}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                                 <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">{t('advanceValue')}</p>
                                 <p className="text-2xl font-bold text-slate-800 dark:text-white">{advance.amount.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{t('currency')}</span></p>
                             </div>
                             <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                                 <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider mb-1">{t('totalSpent')}</p>
                                 <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalApproved.toLocaleString()} <span className="text-sm font-normal text-blue-500 dark:text-blue-400">{t('currency')}</span></p>
                                 {totalPending > 0 && <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">{totalPending.toLocaleString()} {t('statusPending')}</p>}
                             </div>
                             <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 text-center">
                                 <p className="text-xs text-slate-600 dark:text-slate-300 uppercase font-bold tracking-wider mb-1">{t('balance')}</p>
                                 <p className="text-2xl font-bold text-slate-800 dark:text-white">{balance.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{t('currency')}</span></p>
                             </div>
                        </div>
                    </div>
                </div>
            );
        })}

        {openAdvances.length === 0 && (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <Receipt className="mx-auto mb-4 opacity-50" size={48} />
                <p>لا توجد عهد مفتوحة حالياً للتصفية</p>
            </div>
        )}
      </div>

      {renderSettlementModal()}
    </div>
  );
};
