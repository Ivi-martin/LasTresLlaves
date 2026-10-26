import React, { useEffect, useState } from 'react';
import { ToastMessage, notificationService } from '../utils/notifications';

export const ToastOverlay: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.onToast((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4500);
    });

    return () => unsubscribe();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-slate-950/95 border-2 border-amber-500/80 rounded-xl p-3 shadow-2xl text-slate-100 flex items-start gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="text-xl shrink-0">
            {t.type === 'reward' && '🎁'}
            {t.type === 'level' && '⭐'}
            {t.type === 'challenge' && '🎯'}
            {t.type === 'info' && '🔔'}
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-300 tracking-wide">{t.title}</h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{t.body}</p>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="text-slate-500 hover:text-white text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
