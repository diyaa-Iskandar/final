
import React from 'react';
import { LayoutDashboard, FileText, Settings, LogOut, Wallet, X, Briefcase, Users, Scale, Moon, Sun, ChevronLeft, Archive } from 'lucide-react';
import { UserRole } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  closeMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, closeMobileMenu }) => {
  const { t, dir } = useLanguage();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { getStableAvatar } = useData();

  if (!user) return null;

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'projects', label: t('projects'), icon: Briefcase },
    { id: 'team', label: t('team'), icon: Users },
    { id: 'advances', label: t('advances'), icon: Wallet },
    { id: 'settlements', label: t('settlements'), icon: Scale }, 
    { id: 'reports', label: t('reports'), icon: FileText },
    { id: 'archive', label: t('archive'), icon: Archive },
  ];

  const translateClass = dir === 'rtl' 
    ? (isMobileOpen ? 'translate-x-0' : 'translate-x-full') 
    : (isMobileOpen ? 'translate-x-0' : '-translate-x-full');

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={closeMobileMenu}
        />
      )}

      <aside 
        className={`
          fixed inset-y-4 z-50 w-72 
          bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl
          border border-slate-200/50 dark:border-slate-800/50
          shadow-2xl shadow-slate-200/50 dark:shadow-black/50
          rounded-2xl transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          flex flex-col
          ${translateClass}
          md:translate-x-0 
          ${dir === 'rtl' ? 'right-4 md:right-6' : 'left-4 md:left-6'}
        `}
      >
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center">
          <div className="flex items-center gap-3.5 group">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                <img src="https://i.ibb.co/pj75GXSs/logo.png" alt="Petrotec" className="w-11 h-11 object-contain relative z-10 drop-shadow-md" />
            </div>
            <div>
                <h1 className="text-xl font-black bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent tracking-tight">PETROTEC</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise System</p>
            </div>
          </div>
          <button onClick={closeMobileMenu} className="md:hidden p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-100 dark:bg-slate-800 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* User Profile Snippet */}
        <div className="mx-4 mt-6 mb-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex items-center gap-3 shadow-sm">
          <div className="relative">
             <img src={user.avatarUrl || getStableAvatar(user.name)} alt={user.name} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-md" />
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
          </div>
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-800 dark:text-white truncate">{user.name}</p>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate uppercase tracking-wider">
              {user.role === UserRole.ADMIN ? t('roleAdmin') : (user.role === UserRole.ENGINEER ? t('roleEngineer') : t('roleTechnician'))}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2 custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); closeMobileMenu(); }}
              className={`
                relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-medium transition-all duration-300 group
                ${activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 translate-x-1' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'}
              `}
            >
              <item.icon size={20} className={`${activeTab === item.id ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500'} transition-colors`} />
              <span className="flex-1 text-start">{item.label}</span>
              {activeTab === item.id && <ChevronLeft size={16} className={`opacity-50 ${dir === 'ltr' ? 'rotate-180' : ''}`} />}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mx-4 mb-4 mt-2 bg-slate-50/80 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 backdrop-blur-md space-y-2">
            <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm"
            >
                <div className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-500" />}
                    <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${theme === 'dark' ? 'left-4' : 'left-0.5'}`}></div>
                </div>
            </button>
            
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => { setActiveTab('settings'); closeMobileMenu(); }}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-600 shadow-sm'}`}
                >
                    <Settings size={16} />
                    <span>{t('settings')}</span>
                </button>
                <button 
                    onClick={logout}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                    <LogOut size={16} />
                    <span>{t('logout')}</span>
                </button>
            </div>
        </div>
      </aside>
    </>
  );
};
