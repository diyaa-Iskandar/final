
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Briefcase, MapPin, Plus, X, Archive, Wallet, FileText, ArrowDown, ChevronRight, CheckCircle, AlertCircle, Coins, Image as ImageIcon, AlertTriangle, ArrowRightCircle, Loader, Trash2 } from 'lucide-react';
import { UserRole, AdvanceStatus, ExpenseStatus } from '../types';
import { useNotification } from '../contexts/NotificationContext';

export const Projects: React.FC = () => {
  const { t } = useLanguage();
  const { projects, addProject, archiveProject, advances, expenses, users, addAdvance } = useData();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [showModal, setShowModal] = useState(false);
  const [showArchiveWarning, setShowArchiveWarning] = useState(false); // نافذة التحذير
  const [projectToArchive, setProjectToArchive] = useState<string | null>(null);
  const [isArchivingId, setIsArchivingId] = useState<string | null>(null); // حالة تحميل الأرشفة

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<string | null>(null);
  const [expandedAdvanceId, setExpandedAdvanceId] = useState<string | null>(null);

  // States for Carry Over Advance (ترحيل العجز)
  const [showCarryOverModal, setShowCarryOverModal] = useState(false);
  const [carryOverData, setCarryOverData] = useState({ projectId: '', userId: '', amount: 0, description: '' });

  if (!user) return null;

  // Filter Active Projects Only (Status based)
  const activeProjects = projects.filter(p => p.status === 'ACTIVE' || !p.status); // Fallback !p.status for legacy data

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if(name && location) {
        addProject({
            name,
            location,
            managerId: user.id
        });
        setShowModal(false);
        setName('');
        setLocation('');
    }
  };

  const handleArchiveClick = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      
      // 1. Check for active advances
      const projectAdvances = advances.filter(a => a.projectId === id);
      const hasActiveAdvances = projectAdvances.some(a => a.status === AdvanceStatus.OPEN || a.status === AdvanceStatus.PENDING);

      if (hasActiveAdvances) {
          setProjectToArchive(id);
          setShowArchiveWarning(true);
      } else {
          if(window.confirm('هل أنت متأكد من أرشفة هذا المشروع؟ سيتم نقله إلى الأعمال السابقة.')) {
              setIsArchivingId(id);
              const success = await archiveProject(id);
              setIsArchivingId(null);
              if(!success) {
                  // Fallback alert handled in DataContext
              }
          }
      }
  };

  // --- Project Details Logic ---
  const projectDetails = useMemo(() => {
      if(!selectedProjectForDetails) return null;
      const project = projects.find(p => p.id === selectedProjectForDetails);
      if(!project) return null;

      const projectAdvances = advances.filter(a => a.projectId === project.id);
      
      const advancesWithExpenses = projectAdvances.map(adv => {
          const advExpenses = expenses.filter(e => e.advanceId === adv.id);
          const totalSpent = advExpenses.filter(e => e.status === ExpenseStatus.APPROVED).reduce((sum, e) => sum + e.amount, 0);
          
          let deficit = 0;
          let returned = 0;
          let settlementNotes = '';
          if (adv.settlementData) {
              deficit = (adv.settlementData as any).deficitAmount || (adv.settlementData as any).deficit || 0;
              returned = adv.settlementData.returnedCashAmount || 0;
              settlementNotes = adv.settlementData.notes || '';
          }

          return {
              ...adv,
              expenses: advExpenses,
              totalSpent,
              deficit,
              returned,
              settlementNotes
          };
      });

      return {
          project,
          advances: advancesWithExpenses
      };
  }, [selectedProjectForDetails, projects, advances, expenses]);

  const handleCarryOverDeficit = (adv: any) => {
      setCarryOverData({
          projectId: adv.projectId,
          userId: adv.userId,
          amount: adv.deficit,
          description: `ترحيل عجز عهدة: ${adv.description}`
      });
      setShowCarryOverModal(true);
  };

  const confirmCarryOver = async () => {
      await addAdvance({
          projectId: carryOverData.projectId,
          userId: carryOverData.userId,
          amount: carryOverData.amount,
          description: carryOverData.description
      });
      setShowCarryOverModal(false);
      showNotification('تم إنشاء عهدة جديدة بقيمة العجز بنجاح', 'success');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm"><Briefcase size={24} /></div>
            {t('projectsList')}
        </h2>
        {user.role === UserRole.ADMIN && (
            <Button onClick={() => setShowModal(true)} className="shadow-lg shadow-blue-500/20">
                <Plus size={18} />
                <span>{t('addProject')}</span>
            </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeProjects.map(proj => (
            // Card Container
            <div 
                key={proj.id} 
                onClick={() => setSelectedProjectForDetails(proj.id)}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden group"
            >
                {/* Card Body */}
                <div className="p-6 pb-2">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                            <Briefcase size={24} />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{proj.name}</h3>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium">
                            <MapPin size={16} />
                            <span>{proj.location}</span>
                        </div>
                    </div>
                </div>

                {/* Card Footer - Action Bar */}
                <div className="p-4 pt-0 mt-4 flex justify-between items-center border-t border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">الإجراءات</div>
                    
                    {user.role === UserRole.ADMIN && (
                        <button 
                            onClick={(e) => handleArchiveClick(e, proj.id)}
                            disabled={isArchivingId === proj.id}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-slate-500 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400 rounded-xl border border-slate-200 dark:border-slate-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            title={t('archiveProject')}
                            type="button"
                        >
                            {isArchivingId === proj.id ? (
                                <Loader size={16} className="animate-spin text-amber-500"/>
                            ) : (
                                <Archive size={16} />
                            )}
                            <span className="text-xs font-bold">أرشفة</span>
                        </button>
                    )}
                </div>
            </div>
        ))}
        {activeProjects.length === 0 && (
            <div className="col-span-full py-24 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center">
                <Briefcase size={64} className="mb-4 opacity-20" />
                <p className="font-bold">{t('noProjects')}</p>
            </div>
        )}
      </div>

      {/* ... (Keep existing modals: showModal, showArchiveWarning, showCarryOverModal, detailsModal) ... */}
      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scale-in border border-white/10">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-black text-slate-800 dark:text-white">{t('addProject')}</h3>
               <button onClick={() => setShowModal(false)} className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm transition-colors border border-slate-100 dark:border-slate-700"><X size={20} /></button>
             </div>
             <form onSubmit={handleAdd} className="space-y-5">
                 <div>
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{t('projectName')}</label>
                     <input required type="text" value={name} onChange={e => setName(e.target.value)} className="input-modern w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500" placeholder="اسم المشروع..."/>
                 </div>
                 <div>
                     <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{t('projectLocation')}</label>
                     <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="input-modern w-full p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500" placeholder="موقع المشروع..."/>
                 </div>
                 <div className="pt-4"><Button type="submit" className="w-full py-4 text-lg font-bold shadow-xl shadow-blue-500/20 rounded-xl">{t('save')}</Button></div>
             </form>
           </div>
        </div>
      )}

      {/* ARCHIVE WARNING MODAL */}
      {showArchiveWarning && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scale-in border border-white/10 text-center">
                  <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32} /></div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">لا يمكن أرشفة المشروع</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">هناك عهد نشطة (سارية أو معلقة) مرتبطة بهذا المشروع. <br/>يجب تصفية وإغلاق جميع العهد أولاً.</p>
                  <Button onClick={() => setShowArchiveWarning(false)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border-0 shadow-none">حسناً، فهمت</Button>
              </div>
          </div>
      )}

      {/* CARRY OVER DEFICIT MODAL */}
      {showCarryOverModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scale-in border border-white/10">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white mb-4">تأكيد ترحيل العجز</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">سيتم إنشاء عهدة جديدة للموظف بقيمة العجز ({carryOverData.amount}) ليتم خصمها أو تسويتها لاحقاً.</p>
                  <div className="space-y-3">
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700"><p className="text-xs text-slate-400 font-bold">الوصف</p><p className="font-bold text-slate-800 dark:text-white">{carryOverData.description}</p></div>
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700"><p className="text-xs text-slate-400 font-bold">المبلغ</p><p className="font-bold text-red-600 dark:text-red-400">{carryOverData.amount}</p></div>
                  </div>
                  <div className="flex gap-3 mt-6">
                      <Button onClick={() => setShowCarryOverModal(false)} variant="secondary" className="flex-1">إلغاء</Button>
                      <Button onClick={confirmCarryOver} className="flex-1">تأكيد وإنشاء</Button>
                  </div>
              </div>
          </div>
      )}

      {/* PROJECT DETAILS MODAL */}
      {selectedProjectForDetails && projectDetails && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in" onClick={() => setSelectedProjectForDetails(null)}>
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] border border-white/10" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <div>
                          <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Briefcase size={24} className="text-blue-600" />{projectDetails.project.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2"><MapPin size={14} /> {projectDetails.project.location}</p>
                      </div>
                      <button onClick={() => setSelectedProjectForDetails(null)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:text-red-500 shadow-sm"><X size={24} /></button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                      {projectDetails.advances.length === 0 ? (
                          <div className="text-center py-12 text-slate-400">لا توجد عهد أو معاملات مالية لهذا المشروع</div>
                      ) : (
                          projectDetails.advances.map(adv => (
                              <div key={adv.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                  <div className="p-5 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => setExpandedAdvanceId(expandedAdvanceId === adv.id ? null : adv.id)}>
                                      <div className="flex items-center gap-4 w-full md:w-auto">
                                          <div className={`p-3 rounded-xl ${adv.status === AdvanceStatus.OPEN ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}><Wallet size={20} /></div>
                                          <div>
                                              <h4 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">{adv.description} {adv.status === AdvanceStatus.CLOSED && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 px-2 py-0.5 rounded-full">تمت التصفية</span>}</h4>
                                              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1"><span>{users.find(u => u.id === adv.userId)?.name}</span><span className="w-1 h-1 bg-slate-300 rounded-full"></span><span>{adv.date}</span></div>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                          <div className="text-end"><p className="text-[10px] text-slate-400 uppercase font-bold">قيمة العهدة</p><p className="font-bold text-slate-800 dark:text-white">{adv.amount.toLocaleString()} <span className="text-[10px] text-slate-400">ج.م</span></p></div>
                                          {adv.status === AdvanceStatus.CLOSED && adv.deficit > 0 && (<div className="text-end bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg border border-red-100 dark:border-red-900/30"><p className="text-[10px] text-red-500 uppercase font-bold flex items-center gap-1"><AlertCircle size={10}/> عجز مالي</p><p className="font-black text-red-600 dark:text-red-400">{adv.deficit.toLocaleString()}</p></div>)}
                                          <div className="text-slate-300">{expandedAdvanceId === adv.id ? <ArrowDown size={20}/> : <ChevronRight size={20} className="rtl:rotate-180"/>}</div>
                                      </div>
                                  </div>
                                  {expandedAdvanceId === adv.id && (
                                      <div className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 p-4 animate-slide-up">
                                          {adv.status === AdvanceStatus.CLOSED && (
                                              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-600 mb-4 shadow-sm">
                                                  <h5 className="text-xs font-bold text-slate-800 dark:text-white mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">تفاصيل التصفية والإغلاق</h5>
                                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                      <div><span className="block text-slate-400 text-xs">إجمالي المصروف المعتمد</span><span className="font-bold text-slate-700 dark:text-slate-200">{adv.totalSpent.toLocaleString()}</span></div>
                                                      <div><span className="block text-slate-400 text-xs">المبلغ المورد (كاش)</span><span className="font-bold text-green-600">{adv.returned.toLocaleString()}</span></div>
                                                      <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30"><span className="block text-red-500 text-xs font-bold">العجز (المستحق)</span><span className="font-black text-red-600 dark:text-red-400 text-lg">{adv.deficit.toLocaleString()}</span></div>
                                                  </div>
                                                  {adv.settlementNotes && (<div className="mt-3 text-xs bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-200"><strong>ملاحظات التصفية:</strong> {adv.settlementNotes}</div>)}
                                                  {adv.deficit > 0 && (<div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end"><button onClick={(e) => { e.stopPropagation(); handleCarryOverDeficit(adv); }} className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors font-bold"><ArrowRightCircle size={14} /> ترحيل العجز لعهدة جديدة</button></div>)}
                                              </div>
                                          )}
                                          <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2"><FileText size={14}/> سجل المصروفات</h5>
                                          {adv.expenses.length > 0 ? (
                                              <div className="space-y-2">{adv.expenses.map(exp => (<div key={exp.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-sm shadow-sm"><div className="flex items-center gap-3">{exp.imageUrl ? (<div className="w-8 h-8 rounded-lg bg-slate-200 overflow-hidden"><img src={exp.imageUrl} className="w-full h-full object-cover"/></div>) : <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><FileText size={14}/></div>}<div><p className="font-bold text-slate-700 dark:text-slate-200">{exp.description}</p><p className="text-[10px] text-slate-400">{exp.date}</p></div></div><div className="flex items-center gap-3">{exp.status === ExpenseStatus.APPROVED ? <CheckCircle size={14} className="text-green-500"/> : (exp.status === ExpenseStatus.REJECTED ? <AlertCircle size={14} className="text-red-500"/> : <Coins size={14} className="text-amber-500"/>)}<span className="font-bold text-slate-800 dark:text-white">{exp.amount.toLocaleString()}</span></div></div>))}</div>
                                          ) : <p className="text-center text-xs text-slate-400 italic py-2">لا توجد مصروفات مسجلة</p>}
                                      </div>
                                  )}
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
