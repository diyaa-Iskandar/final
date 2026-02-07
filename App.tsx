
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Advances } from './pages/Advances';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Projects } from './pages/Projects';
import { Archive } from './pages/Archive'; 
import { Team } from './pages/Team';
import { Settlements } from './pages/Settlements';
import { Button } from './components/Button';
import { useLanguage } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { useNotification } from './contexts/NotificationContext';
import { useTheme } from './contexts/ThemeContext';
import { Menu, Eye, EyeOff, Moon, Sun, Lock, Mail, ArrowRight, Bell, Check, Trash2 } from 'lucide-react';
import { AppNotification } from './types';

const LoginPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const { theme, toggleTheme } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const success = await login(email, password);
      if(!success) {
          showNotification(t('msgLoginFailed'), 'error');
          setIsLoading(false);
      }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center bg-slate-900 transition-colors duration-500" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Background Visuals */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-950 via-slate-950 to-black"></div>
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-float"></div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 flex flex-col lg:flex-row h-full items-center justify-center lg:justify-between min-h-screen gap-10 lg:gap-0">
          {/* Left Side */}
          <div className="w-full lg:w-1/2 text-center lg:text-start lg:pl-20 mt-10 lg:mt-0">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex items-center justify-center mx-auto lg:mx-0 mb-6 lg:mb-8 animate-scale-in">
                  <img src="https://i.ibb.co/pj75GXSs/logo.png" alt="Logo" className="w-14 h-14 object-contain drop-shadow-lg" />
              </div>
              <h1 className="text-4xl lg:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg animate-slide-up">
                  PETROTEC <br/>
                  <span className="text-blue-400 font-light">Engineering</span>
              </h1>
              <p className="text-slate-300 text-base lg:text-xl max-w-md mx-auto lg:mx-0 leading-relaxed opacity-90 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                 نظام إدارة مركزي متكامل للمصروفات والعهد والمشاريع الهندسية.
              </p>
          </div>

          {/* Right Side: Login Card */}
          <div className="w-full lg:w-[480px] lg:mr-20 mb-10 lg:mb-0">
              <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700 animate-slide-up relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                  <div className="flex justify-between items-center mb-8">
                      <div>
                          <h2 className="text-2xl font-black text-slate-800 dark:text-white">{t('welcome')}</h2>
                          <p className="text-slate-500 text-sm font-bold">تسجيل الدخول للمتابعة</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={toggleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button 
                            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                        >
                            {language === 'ar' ? 'EN' : 'ع'}
                        </button>
                      </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('userEmail')}</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10">
                                <Mail size={18} />
                            </div>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-sm" 
                                dir="ltr" 
                                placeholder="username@petrotec.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('userPassword')}</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none z-10">
                                <Lock size={18} />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required 
                                className="w-full pl-11 pr-11 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-sm" 
                                dir="ltr" 
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-20 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-slate-100" />
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">تذكرني</span>
                        </label>
                        <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">هل نسيت كلمة المرور؟</a>
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full py-4 text-base font-bold rounded-xl shadow-xl shadow-blue-500/20 group relative overflow-hidden mt-2" 
                        variant="primary"
                        isLoading={isLoading}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            تسجيل الدخول <ArrowRight size={18} className={`transform transition-transform ${language === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                        </span>
                    </Button>
                  </form>
              </div>
          </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const { notifications, unreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead, setRedirect, redirectTarget, clearRedirectTarget } = useData();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (user) {
          setActiveTab('dashboard');
      }
  }, [user?.id]); 

  // Watch for global redirect requests
  useEffect(() => {
      if (redirectTarget) {
          setActiveTab(redirectTarget.page);
          // Note: The specific component (e.g. Dashboard or Advances) will read redirectTarget.itemId
          // We don't clear it here, the target component will clear it after opening the modal
      }
  }, [redirectTarget]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
              setIsNotificationsOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: AppNotification) => {
      markNotificationAsRead(notif.id);
      setIsNotificationsOpen(false);
      
      // Smart Redirect Logic
      if (notif.targetPage && notif.targetId) {
          let itemType: 'ADVANCE' | 'EXPENSE' = 'ADVANCE'; // Default
          // Try to guess type or rely on schema if improved
          // For now, based on pages:
          if (notif.targetPage === 'dashboard') {
              // Usually expenses on dashboard
              itemType = 'EXPENSE';
          } else if (notif.targetPage === 'advances') {
              itemType = 'ADVANCE';
          }
          
          setRedirect(notif.targetPage, notif.targetId, itemType);
      }
  };

  if (!user) {
    return <LoginPage />;
  }

  const headerFlexClass = `flex items-center w-full justify-between relative`;

  return (
    <div className="min-h-screen bg-dot-pattern flex transition-colors duration-300" dir={dir}>
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      
      <main className={`
        flex-1 p-4 md:p-8 transition-all duration-300 w-full overflow-x-hidden
        ${dir === 'rtl' ? 'md:mr-72' : 'md:ml-72'}
      `}>
        {/* HEADER */}
        <header className="mb-8 relative z-20">
          <div className={headerFlexClass}>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Menu size={24} />
                </button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white transition-colors">
                    {activeTab === 'dashboard' && t('dashboard')}
                    {activeTab === 'projects' && t('projects')}
                    {activeTab === 'archive' && t('archive')} 
                    {activeTab === 'team' && t('team')}
                    {activeTab === 'advances' && t('advances')}
                    {activeTab === 'settlements' && t('settlements')}
                    {activeTab === 'reports' && t('reports')}
                    {activeTab === 'settings' && t('settings')}
                  </h1>
                </div>
              </div>

              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2" 
                ref={notificationRef}
              >
                  <button 
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative"
                  >
                      <Bell size={20} />
                      {unreadNotificationsCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-pulse">
                              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                          </span>
                      )}
                  </button>

                  {/* Notification Dropdown */}
                  {isNotificationsOpen && (
                      <div className={`
                          absolute top-14 left-0 w-80 md:w-96
                          bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[60] animate-scale-in origin-top-left
                      `}>
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
                              <h3 className="font-bold text-slate-800 dark:text-white">الإشعارات</h3>
                              {notifications.length > 0 && (
                                  <button onClick={markAllNotificationsAsRead} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                      <Check size={14} /> تحديد الكل كمقروء
                                  </button>
                              )}
                          </div>
                          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                              {notifications.length === 0 ? (
                                  <div className="py-12 text-center text-slate-400">
                                      <Bell size={40} className="mx-auto mb-2 opacity-20" />
                                      <p className="text-sm">لا توجد إشعارات جديدة</p>
                                  </div>
                              ) : (
                                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                      {notifications.map(notif => (
                                          <div 
                                              key={notif.id} 
                                              className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                              onClick={() => handleNotificationClick(notif)}
                                          >
                                              <div className="flex gap-3">
                                                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                                  <div>
                                                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-slate-800 dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                                                          {notif.title}
                                                      </p>
                                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                          {notif.message}
                                                      </p>
                                                      <p className="text-[10px] text-slate-400 mt-2">
                                                          {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                      </p>
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </header>

        <div className="animate-fade-in">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'projects' && <Projects />}
          {activeTab === 'archive' && <Archive />} 
          {activeTab === 'team' && <Team />}
          {activeTab === 'advances' && <Advances />}
          {activeTab === 'settlements' && <Settlements />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}
