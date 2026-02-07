
import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Briefcase, MapPin, Archive as ArchiveIcon, Download, FileSpreadsheet, X, Wallet, FileText, ArrowDown, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExpenseStatus } from '../types';
import { Button } from '../components/Button';

export const Archive: React.FC = () => {
  const { t } = useLanguage();
  const { projects, advances, expenses, users } = useData();
  
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState<string | null>(null);
  const [expandedAdvanceId, setExpandedAdvanceId] = useState<string | null>(null);

  // Filter Archived Projects Only - Status Based
  const archivedProjects = projects.filter(p => p.status === 'ARCHIVED');

  // --- EXPORT FULL REPORT FOR A PROJECT ---
  const exportFullProjectReport = (e: React.MouseEvent, projectId: string) => {
      e.stopPropagation();
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const projectAdvances = advances.filter(a => a.projectId === projectId);
      
      const wb = XLSX.utils.book_new();

      // Sheet 1: Summary
      const summaryData: any[][] = [
          [{ v: "PETROTEC ENGINEERING - Project Archive Report", t: "s" }],
          [],
          ["Project Name", project.name],
          ["Location", project.location],
          ["Archived Date", new Date().toLocaleDateString()],
          [],
          ["Advance Description", "Employee", "Date", "Status", "Amount", "Spent", "Returned", "Deficit"]
      ];

      projectAdvances.forEach(adv => {
          const advExpenses = expenses.filter(e => e.advanceId === adv.id);
          const totalSpent = advExpenses.filter(e => e.status === ExpenseStatus.APPROVED).reduce((sum, e) => sum + e.amount, 0);
          const deficit = adv.settlementData?.deficitAmount || 0;
          const returned = adv.settlementData?.returnedCashAmount || 0;
          const user = users.find(u => u.id === adv.userId)?.name || adv.userId;

          summaryData.push([
              adv.description,
              user,
              adv.date,
              adv.status,
              adv.amount,
              totalSpent,
              returned,
              deficit
          ]);
      });

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWS['!cols'] = [{wch: 30}, {wch: 20}, {wch: 15}, {wch: 10}, {wch: 12}, {wch: 12}, {wch: 12}, {wch: 12}];
      XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

      // Sheet 2: All Expenses Details
      const expensesData: any[][] = [
          ["Advance", "Expense Description", "Date", "Amount", "Status", "Notes", "Is Invoice?"]
      ];

      projectAdvances.forEach(adv => {
          const advExpenses = expenses.filter(e => e.advanceId === adv.id);
          advExpenses.forEach(exp => {
              expensesData.push([
                  adv.description,
                  exp.description,
                  exp.date,
                  exp.amount,
                  exp.status,
                  exp.notes || "",
                  exp.isInvoice ? "Yes" : "No"
              ]);
          });
      });

      const expensesWS = XLSX.utils.aoa_to_sheet(expensesData);
      expensesWS['!cols'] = [{wch: 30}, {wch: 30}, {wch: 15}, {wch: 12}, {wch: 12}, {wch: 40}, {wch: 10}];
      XLSX.utils.book_append_sheet(wb, expensesWS, "Detailed Expenses");

      XLSX.writeFile(wb, `Archive_Report_${project.name}.xlsx`);
  };

  // --- Reuse Details Logic ---
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
          if (adv.settlementData) {
              deficit = adv.settlementData.deficitAmount || 0;
              returned = adv.settlementData.returnedCashAmount || 0;
          }

          return {
              ...adv,
              expenses: advExpenses,
              totalSpent,
              deficit,
              returned
          };
      });

      return { project, advances: advancesWithExpenses };
  }, [selectedProjectForDetails, projects, advances, expenses]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400 shadow-sm"><ArchiveIcon size={24} /></div>
            {t('archive')} <span className="text-sm font-normal text-slate-400">({archivedProjects.length})</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {archivedProjects.map(proj => (
            <div 
                key={proj.id} 
                onClick={() => setSelectedProjectForDetails(proj.id)}
                className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 group transition-all duration-300 hover:shadow-lg cursor-pointer relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 px-4 py-1 rounded-bl-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest">Archived</div>
                
                <div className="flex items-start justify-between mt-2">
                    <div className="p-3 bg-slate-100 dark:bg-slate-900 text-slate-500 rounded-2xl">
                        <Briefcase size={24} />
                    </div>
                    <button 
                        onClick={(e) => exportFullProjectReport(e, proj.id)}
                        className="text-green-600 hover:text-green-700 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex items-center gap-2"
                        title={t('exportExcel')}
                    >
                        <FileSpreadsheet size={20} />
                    </button>
                </div>
                <div>
                    <h3 className="font-black text-xl text-slate-700 dark:text-slate-200 line-through decoration-slate-400 decoration-2">{proj.name}</h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-2 font-medium">
                        <MapPin size={16} />
                        <span>{proj.location}</span>
                    </div>
                </div>
            </div>
        ))}
        {archivedProjects.length === 0 && (
            <div className="col-span-full py-24 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center">
                <ArchiveIcon size={64} className="mb-4 opacity-20" />
                <p className="font-bold">لا توجد مشاريع في الأرشيف</p>
            </div>
        )}
      </div>

      {/* --- ARCHIVE DETAILS MODAL (Same Layout as Projects) --- */}
      {selectedProjectForDetails && projectDetails && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fade-in" onClick={() => setSelectedProjectForDetails(null)}>
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh] border border-white/10" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-amber-50 dark:bg-amber-900/20">
                      <div>
                          <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                              <ArchiveIcon size={24} className="text-amber-600" />
                              {projectDetails.project.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                              <MapPin size={14} /> {projectDetails.project.location}
                          </p>
                      </div>
                      <div className="flex gap-2">
                          <Button onClick={(e) => {exportFullProjectReport(e, projectDetails.project.id)}} className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2">
                              <Download size={16} className="mr-2"/> Report
                          </Button>
                          <button onClick={() => setSelectedProjectForDetails(null)} className="p-2 bg-white dark:bg-slate-800 rounded-full hover:text-red-500 shadow-sm"><X size={24} /></button>
                      </div>
                  </div>

                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                      {projectDetails.advances.map(adv => (
                          <div key={adv.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm opacity-90">
                              <div 
                                className="p-5 flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                onClick={() => setExpandedAdvanceId(expandedAdvanceId === adv.id ? null : adv.id)}
                              >
                                  <div className="flex items-center gap-4 w-full md:w-auto">
                                      <div className={`p-3 rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-700`}>
                                          <Wallet size={20} />
                                      </div>
                                      <div>
                                          <h4 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                                              {adv.description}
                                              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 px-2 py-0.5 rounded-full">{adv.status}</span>
                                          </h4>
                                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                              <span>{users.find(u => u.id === adv.userId)?.name}</span>
                                              <span>•</span>
                                              <span>{adv.date}</span>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                      <div className="text-end">
                                          <p className="text-[10px] text-slate-400 uppercase font-bold">قيمة العهدة</p>
                                          <p className="font-bold text-slate-800 dark:text-white">{adv.amount.toLocaleString()}</p>
                                      </div>
                                      {adv.deficit > 0 && (
                                          <div className="text-end bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg">
                                              <p className="text-[10px] text-red-500 uppercase font-bold">عجز</p>
                                              <p className="font-black text-red-600 dark:text-red-400">{adv.deficit.toLocaleString()}</p>
                                          </div>
                                      )}
                                      <div className="text-slate-300">
                                          {expandedAdvanceId === adv.id ? <ArrowDown size={20}/> : <ChevronRight size={20} className="rtl:rotate-180"/>}
                                      </div>
                                  </div>
                              </div>

                              {expandedAdvanceId === adv.id && (
                                  <div className="bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 p-4">
                                      {adv.expenses.map(exp => (
                                          <div key={exp.id} className="bg-white dark:bg-slate-800 p-3 mb-2 rounded-xl border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-sm shadow-sm">
                                              <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><FileText size={14}/></div>
                                                  <div>
                                                      <p className="font-bold text-slate-700 dark:text-slate-200">{exp.description}</p>
                                                      <p className="text-[10px] text-slate-400">{exp.date}</p>
                                                  </div>
                                              </div>
                                              <span className="font-bold text-slate-800 dark:text-white">{exp.amount.toLocaleString()}</span>
                                          </div>
                                      ))}
                                      
                                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-6 text-xs">
                                          <div><span className="text-slate-400">Spent:</span> <span className="font-bold">{adv.totalSpent.toLocaleString()}</span></div>
                                          <div><span className="text-slate-400">Returned:</span> <span className="font-bold text-green-600">{adv.returned.toLocaleString()}</span></div>
                                          <div><span className="text-slate-400">Deficit:</span> <span className="font-bold text-red-600">{adv.deficit.toLocaleString()}</span></div>
                                      </div>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
