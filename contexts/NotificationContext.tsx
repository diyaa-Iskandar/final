import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info, BellRing } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, withSound?: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // رابط صوت تنبيه احترافي وخفيف
  const audioRef = useRef<HTMLAudioElement>(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  const showNotification = useCallback((message: string, type: NotificationType = 'info', withSound: boolean = false) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);

    if (withSound) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }

    // إخفاء الإشعار تلقائياً بعد 4 ثواني
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl transform transition-all duration-300 animate-slide-up border-l-4 backdrop-blur-md
              ${notification.type === 'success' ? 'bg-white/90 dark:bg-slate-800/90 border-green-500 text-slate-800 dark:text-white' : ''}
              ${notification.type === 'error' ? 'bg-white/90 dark:bg-slate-800/90 border-red-500 text-slate-800 dark:text-white' : ''}
              ${notification.type === 'warning' ? 'bg-white/90 dark:bg-slate-800/90 border-amber-500 text-slate-800 dark:text-white' : ''}
              ${notification.type === 'info' ? 'bg-slate-800/90 dark:bg-slate-700/90 border-blue-500 text-white' : ''}
            `}
          >
            <div className={`p-2 rounded-full ${
                notification.type === 'success' ? 'bg-green-100 text-green-600' : 
                notification.type === 'error' ? 'bg-red-100 text-red-600' : 
                notification.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                'bg-blue-500/20 text-blue-200'
            }`}>
                {notification.type === 'success' && <CheckCircle size={20} />}
                {(notification.type === 'error' || notification.type === 'warning') && <AlertCircle size={20} />}
                {notification.type === 'info' && <BellRing size={20} />}
            </div>
            
            <p className="flex-1 text-sm font-bold">{notification.message}</p>
            
            <button 
              onClick={() => removeNotification(notification.id)}
              className="opacity-50 hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded-full"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};