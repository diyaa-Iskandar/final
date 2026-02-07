
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Download, Filter, FileSpreadsheet, Calendar, User, Briefcase, FileText, Image as ImageIcon, X, StickyNote, FileCheck, DollarSign, ChevronDown, ChevronRight, Wallet, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Expense, ExpenseStatus, AdvanceStatus } from '../types';
import * as XLSX from 'xlsx';

export const Reports: React.FC = () => {
  const { t } = useLanguage();
  const { expenses, advances, projects, users, getMyTeam, getStableAvatar } = useData(); 
  const { user } = useAuth();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>([]);
  const [expandedAdvanceIds, setExpandedAdvanceIds] = useState<string[]>([]);

  const myTeam = getMyTeam();

  const availableUsers = useMemo(() => {
      if (selectedProjectId) {
          const userIdsInProject = advances.filter(a => a.projectId === selectedProjectId).map(a => a.userId);
          return myTeam.filter(u => userIdsInProject.includes(u.id));
      }
      return myTeam;
  }, [selectedProjectId, advances, myTeam]);

  // Main Data Processing for Hierarchy
  const hierarchyData = useMemo(() => {
      let relevantProjects = projects;
      if (selectedProjectId) relevantProjects = projects.filter(p => p.id === selectedProjectId);

      return relevantProjects.map(project => {
          let projectAdvances = advances.filter(a => a.projectId === project.id);
          
          if (selectedUserId) {
              projectAdvances = projectAdvances.filter(a => a.userId === selectedUserId);
          }
          if (startDate) projectAdvances = projectAdvances.filter(a => a.date >= startDate);
          if (endDate) projectAdvances = projectAdvances.filter(a => a.date <= endDate);

          const advancesWithExpenses = projectAdvances.map(adv => {
              const advExpenses = expenses.filter(e => e.advanceId === adv.id);
              const totalSpent = advExpenses.filter(e => e.status === ExpenseStatus.APPROVED).reduce((sum, e) => sum + e.amount, 0);
              
              const deficit = adv.settlementData?.deficitAmount || 0;
              const returned = adv.settlementData?.returnedCashAmount || 0;
              const notes = adv.settlementData?.notes || '';

              return { ...adv, expenses: advExpenses, totalSpent, deficit, returned, settlementNotes: notes };
          });

          if (projectAdvances.length === 0) return null;

          return {
              project,
              advances: advancesWithExpenses,
              totalProjectSpent: advancesWithExpenses.reduce((sum, a) => sum + a.totalSpent, 0)
          };
      }).filter(Boolean);
  }, [projects, advances, expenses, selectedProjectId, selectedUserId, startDate, endDate]);

  // --- دالة التصدير للإكسيل المتطورة (Formulas + Structure) ---
  const handleExportExcel = () => {
      const wb = XLSX.utils.book_new();
      const wsData: any[][] = [];

      // 1. Header Information
      wsData.push(["تقرير المصروفات والعهد - PETROTEC SYSTEM"]);
      wsData.push([`تاريخ التقرير: ${new Date().toLocaleDateString()}`]);
      if (startDate || endDate) wsData.push([`الفترة: من ${startDate || '-'} إلى ${endDate || '-'}`]);
      wsData.push([]); // Spacer

      let grandTotalRowIndex = 0; // لتعقب الصفوف للمعادلات

      // 2. Loop Projects
      hierarchyData.forEach((item: any) => {
          if (!item) return;

          // Project Title Row
          wsData.push([`المشروع: ${item.project.name}`, `الموقع: ${item.project.location}`]);
          
          // Advances Header
          wsData.push(["م", "وصف العهدة", "الموظف", "تاريخ العهدة", "قيمة العهدة", "إجمالي المصروف", "الحالة", "ملاحظات"]);
          
          let projectStartRow = wsData.length; // 1-based index in visual logic, but row index is length

          item.advances.forEach((adv: any, index: number) => {
              const userName = users.find((u:any) => u.id === adv.userId)?.name || adv.userId;
              // Advance Row
              wsData.push([
                  index + 1,
                  adv.description,
                  userName,
                  adv.date,
                  adv.amount, // Column E (Index 4)
                  adv.totalSpent, // Column F (Index 5)
                  t(adv.status === AdvanceStatus.OPEN ? 'statusOpen' : 'statusClosed'),
                  adv.settlementNotes || ''
              ]);

              // Expenses Details (Sub-table)
              if (adv.expenses.length > 0) {
                  wsData.push(["", "   ↳ تفاصيل المصروفات:", "التاريخ", "البند", "القيمة", "الحالة"]);
                  adv.expenses.forEach((exp: any) => {
                      wsData.push([
                          "", 
                          "", 
                          exp.date, 
                          exp.description, 
                          exp.amount, // Value
                          t(exp.status === ExpenseStatus.APPROVED ? 'statusApproved' : 'statusPending')
                      ]);
                  });
                  // Spacer after expenses
                  wsData.push([]); 
              }
          });

          // Project Total Formula Row
          const lastRow = wsData.length;
          // معادلة تقريبية: في الواقع مكتبات الـ JS المجانية لا تدعم كتابة المعادلات بسهولة
          // ولكن سنقوم بوضع القيمة المحسوبة كأرقام، ونحاول وضع الصيغة كنص إذا أمكن
          wsData.push(["", "", "", "إجمالي المشروع:", item.totalProjectSpent, "", ""]);
          wsData.push([]); // Spacer between projects
          wsData.push([]); 
      });

      // إنشاء الشيت
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // تنسيق الأعمدة (Width)
      ws['!cols'] = [
          { wch: 5 },  // م
          { wch: 30 }, // الوصف
          { wch: 20 }, // الموظف/التاريخ
          { wch: 25 }, // التاريخ/البند
          { wch: 15 }, // القيمة
          { wch: 15 }, // المصروف
          { wch: 15 }, // الحالة
          { wch: 30 }  // ملاحظات
      ];

      // دمج الخلايا للعنوان (Merge)
      if(!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }); // Title

      XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
      XLSX.writeFile(wb, `Petrotec_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const toggleProject = (id: string) => {
      setExpandedProjectIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const toggleAdvance = (id: string) => {
      setExpandedAdvanceIds(prev => prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]);
  };

  const monthlyData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(exp => {
      const month = exp.date.substring(0, 7); 
      data[month] = (data[month] || 0) + exp.amount;
    });
    return Object.entries(data).map(([key, value]) => ({ name: key, amount: value }));
  }, [expenses]);

  const advancesStatusData = useMemo(() => {
     const open = advances.filter(a => a.status === 'OPEN').length;
     const closed = advances.filter(a => a.status === 'CLOSED').length;
     return [
        { name: t('statusOpen'), value: open, color: '#16a34a' },
        { name: t('statusClosed'), value: closed, color: '#94a3b8' }
     ];
  }, [advances, t]);

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters Area */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
                  <Filter size={20} className="text-blue-500" />
                  <h3>{t('filter')}</h3>
              </div>
              <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white shadow-green-500/20">
                  <FileSpreadsheet size={18} /> تصدير Excel (شامل)
              </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="relative group"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">{t('dateFrom')}</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-700 dark:text-white outline-none" /></div>
            <div className="relative group"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">{t('dateTo')}</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-700 dark:text-white outline-none" /></div>
            <div className="relative group"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">{t('filterByProject')}</label><select value={selectedProjectId} onChange={e => { setSelectedProjectId(e.target.value); setSelectedUserId(''); }} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-700 dark:text-white outline-none"><option value="">{t('allProjects')}</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div className="relative group"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">{t('filterByUser')}</label><select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-700 dark:text-white outline-none"><option value="">{t('allUsers')}</option>{availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
          </div>
      </div>

      {/* HIERARCHICAL REPORT VIEW */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
           <div className="p-6 border-b border-slate-100 dark:border-slate-700">
               <h3 className="text-lg font-bold text-slate-800 dark:text-white">سجل العهد والمصروفات (تفصيلي)</h3>
           </div>
           
           <div className="p-4 space-y-4">
               {hierarchyData.length === 0 ? (
                   <p className="text-center text-slate-400 py-10">لا توجد بيانات للعرض</p>
               ) : (
                   hierarchyData.map((item: any) => (
                       <div key={item.project.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                           {/* Project Header */}
                           <div onClick={() => toggleProject(item.project.id)} className="bg-slate-50 dark:bg-slate-900 p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">{expandedProjectIds.includes(item.project.id) ? <ChevronDown size={20}/> : <ChevronRight size={20} className="rtl:rotate-180"/>}<Briefcase size={20} className="text-blue-600"/><h4 className="font-bold text-slate-800 dark:text-white text-lg">{item.project.name}</h4><span className="text-xs bg-white dark:bg-slate-800 border px-2 py-0.5 rounded-full text-slate-500">{item.advances.length} عهد</span></div>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{item.totalProjectSpent.toLocaleString()} <span className="text-xs font-normal">ج.م مصروف</span></span>
                           </div>

                           {/* Advances List */}
                           {expandedProjectIds.includes(item.project.id) && (
                               <div className="bg-white dark:bg-slate-800 p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
                                   {item.advances.map((adv: any) => (
                                       <div key={adv.id} className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden">
                                           {/* Advance Header */}
                                           <div onClick={() => toggleAdvance(adv.id)} className="p-3 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-blue-50/30 transition-colors">
                                                <div className="flex items-center gap-3 w-full md:w-auto">
                                                    {expandedAdvanceIds.includes(adv.id) ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400 rtl:rotate-180"/>}
                                                    <Wallet size={18} className="text-emerald-600"/>
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{adv.description}</p>
                                                        <p className="text-[10px] text-slate-500">{users.find((u:any) => u.id === adv.userId)?.name} • {adv.date} • {t(adv.status === AdvanceStatus.OPEN ? 'statusOpen' : 'statusClosed')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 text-xs mt-2 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                                    <div className="text-center"><span className="block text-slate-400">القيمة</span><span className="font-bold">{adv.amount.toLocaleString()}</span></div>
                                                    <div className="text-center"><span className="block text-slate-400">مصروف</span><span className="font-bold text-blue-600">{adv.totalSpent.toLocaleString()}</span></div>
                                                    <div className="text-center"><span className="block text-slate-400">العجز</span><span className={`font-bold ${adv.deficit > 0 ? 'text-red-500' : 'text-slate-600'}`}>{adv.deficit.toLocaleString()}</span></div>
                                                </div>
                                           </div>

                                           {/* Expenses List & Settlement Info */}
                                           {expandedAdvanceIds.includes(adv.id) && (
                                               <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700">
                                                   {/* Show Deficit & Notes explicitly here */}
                                                   {adv.status === AdvanceStatus.CLOSED && (
                                                       <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-xs border border-amber-100 dark:border-amber-800 flex justify-between items-start">
                                                           <div>
                                                               <span className="block font-bold text-amber-800 dark:text-amber-200 mb-1">ملاحظات التصفية:</span>
                                                               <p className="text-slate-700 dark:text-slate-300">{adv.settlementNotes || 'لا توجد ملاحظات'}</p>
                                                           </div>
                                                           {adv.deficit > 0 && (
                                                               <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded font-bold">
                                                                   عجز: {adv.deficit.toLocaleString()}
                                                               </div>
                                                           )}
                                                       </div>
                                                   )}

                                                   {adv.expenses.length > 0 ? (
                                                       <table className="w-full text-xs text-start">
                                                           <thead className="text-slate-400 bg-slate-50 dark:bg-slate-800">
                                                               <tr><th className="p-2 text-start">الوصف</th><th className="p-2 text-start">التاريخ</th><th className="p-2 text-start">المبلغ</th><th className="p-2 text-start">ملاحظات</th></tr>
                                                           </thead>
                                                           <tbody>
                                                               {adv.expenses.map((exp: any) => (
                                                                   <tr key={exp.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                                       <td className="p-2 font-medium">{exp.description}</td><td className="p-2 text-slate-500">{exp.date}</td><td className="p-2 font-bold">{exp.amount.toLocaleString()}</td><td className="p-2 text-slate-500 truncate max-w-[150px]">{exp.notes || '-'}</td>
                                                                   </tr>
                                                               ))}
                                                           </tbody>
                                                       </table>
                                                   ) : <p className="text-center text-xs text-slate-400">لا توجد مصروفات</p>}
                                               </div>
                                           )}
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>
                   ))
               )}
           </div>
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">{t('monthlyExpenses')}</h3>
            <div className="h-80" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="name" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} /><YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#1e293b', color: '#fff' }} cursor={{fill: 'rgba(0,0,0,0.05)'}} /><Bar dataKey="amount" fill="#3b82f6" name={t('amount')} radius={[6, 6, 0, 0]} barSize={40} /></BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">{t('advancesStatus')}</h3>
             <div className="h-80 relative" style={{ minHeight: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={advancesStatusData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" label>{advancesStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#1e293b', color: '#fff' }} /><Legend verticalAlign="bottom" height={36} /></PieChart>
                </ResponsiveContainer>
             </div>
        </div>
      </div>
    </div>
  );
};
