
import React from 'react';
import { AdvanceStatus, ExpenseStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface StatusBadgeProps {
  status: AdvanceStatus | ExpenseStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useLanguage();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case AdvanceStatus.OPEN:
      case ExpenseStatus.APPROVED:
        return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: t(status === AdvanceStatus.OPEN ? 'statusOpen' : 'statusApproved') };
      
      case AdvanceStatus.CLOSED:
        return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: 'bg-slate-500', label: t('statusClosed') };
      
      case ExpenseStatus.PENDING:
      case AdvanceStatus.PENDING:
        return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', label: t('statusPending') };
      
      case ExpenseStatus.REJECTED:
      case AdvanceStatus.REJECTED:
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', label: t('statusRejected') };
      
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-transparent ${config.bg} ${config.text}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} shadow-sm`}></span>
      {config.label}
    </span>
  );
};
