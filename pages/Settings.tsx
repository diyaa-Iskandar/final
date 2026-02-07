
import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole } from '../types';
import { Globe, User, Shield, Mail, Lock, Camera, Phone, Briefcase, LogOut, BellRing, Volume2 } from 'lucide-react';
import { Button } from '../components/Button';
import { useNotification } from '../contexts/NotificationContext';
import { uploadFile } from '../services/supabase';
import { useData } from '../contexts/DataContext';

export const Settings: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { showNotification } = useNotification();
  const { getStableAvatar } = useData();
  
  const [newPassword, setNewPassword] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleUpdatePassword = () => {
      if(newPassword) {
          updateProfile({ password: newPassword });
          setNewPassword('');
          showNotification(t('msgProfileUpdated'), 'success');
      }
  };

  const handleUpdateInfo = () => {
     if(phone !== user.phone || jobTitle !== user.jobTitle) {
         updateProfile({ phone, jobTitle });
         showNotification(t('msgProfileUpdated'), 'success');
     }
  };

  const handleToggleSound = () => {
      const currentSetting = user.preferences?.soundEnabled ?? true;
      updateProfile({ preferences: { ...user.preferences, soundEnabled: !currentSetting } });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const publicUrl = await uploadFile(file);
      
      if (publicUrl) {
        updateProfile({ avatarUrl: publicUrl });
        showNotification(t('msgProfileUpdated'), 'success');
      } else {
        showNotification('حدث خطأ أثناء رفع الصورة', 'error');
      }
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="bg-slate-900 dark:bg-slate-950 h-32 relative">
          <div className="absolute -bottom-10 right-8 group">
            <div className="relative">
                <img 
                  src={user.avatarUrl || getStableAvatar(user.name)} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-700 shadow-md bg-white object-cover"
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    title={t('uploadPhoto')}
                >
                   {isUploading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block"></span> : <Camera size={16} />}
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
          </div>
        </div>
        <div className="pt-14 pb-8 px-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{user.name}</h2>
          <p className="text-slate-500 dark:text-slate-400">{user.jobTitle || user.role}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Mail className="text-blue-600 dark:text-blue-400" size={20} />
                <p className="font-medium text-slate-700 dark:text-slate-200">{user.email}</p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Shield className="text-purple-600 dark:text-purple-400" size={20} />
                <p className="font-medium text-slate-700 dark:text-slate-200">{user.role}</p>
            </div>
             <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Phone className="text-green-600 dark:text-green-400" size={20} />
                <input 
                    type="text" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t('phone')}
                    className="bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-blue-500 outline-none w-full text-slate-800 dark:text-white placeholder-slate-400"
                />
            </div>
             <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Briefcase className="text-orange-600 dark:text-orange-400" size={20} />
                <input 
                    type="text" 
                    value={jobTitle} 
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder={t('jobTitle')}
                    className="bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-blue-500 outline-none w-full text-slate-800 dark:text-white placeholder-slate-400"
                />
            </div>
          </div>
          
           <div className="mt-4 flex justify-end">
             <Button onClick={handleUpdateInfo}>{t('save')}</Button>
           </div>
          
          <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4">{t('changePassword')}</h3>
             <div className="flex gap-4 items-end">
                 <div className="flex-1">
                     <label className="text-xs text-slate-500 dark:text-slate-400">{t('newPassword')}</label>
                     <input 
                        type="text" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full p-2 border border-slate-200 dark:border-slate-600 rounded-lg mt-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                        placeholder="******"
                     />
                 </div>
                 <Button onClick={handleUpdatePassword} variant="secondary">{t('save')}</Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
