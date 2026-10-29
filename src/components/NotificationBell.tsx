import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Radio, CheckCircle, Info } from 'lucide-react';
import { apiRequest } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { AppNotification } from '../types/index.js';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = async () => {
    const res = await apiRequest('/api/notifications');
    if (res.success && res.data?.notifications) {
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.notifications.filter((n: AppNotification) => !n.read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = getSocket();

    const handleNewNotif = (notif: any) => {
      setNotifications(prev => [
        {
          id: 'live-' + Date.now(),
          title: notif.title || 'Emergency Update',
          message: notif.message || (notif.requestCode ? `Status update for ${notif.requestCode}: ${notif.status || notif.newStatus}` : 'Real-time alert received'),
          type: notif.severity === 'CRITICAL' ? 'ALERT' : notif.type || 'INFO',
          read: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setUnreadCount(c => c + 1);
    };

    socket.on('broadcast:emergency', handleNewNotif);
    socket.on('request:escalated', handleNewNotif);
    socket.on('request:created', (req: any) => {
      handleNewNotif({
        title: `NEW DISTRESS: ${req.request_code}`,
        message: `${req.emergency_type} emergency reported: ${req.description?.substring(0, 70)}...`,
        type: 'EMERGENCY',
      });
    });
    socket.on('request:claimed', handleNewNotif);
    socket.on('request:status_changed', handleNewNotif);

    return () => {
      socket.off('broadcast:emergency');
      socket.off('request:escalated');
      socket.off('request:created');
      socket.off('request:claimed');
      socket.off('request:status_changed');
    };
  }, []);

  const markAsRead = async (id: string) => {
    if (!id.startsWith('live-')) {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
    }
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        id="btn-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-400" />
              <h4 className="text-sm font-semibold">Incident Notifications</h4>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-rose-300 hover:text-white underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
                No active notifications
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                    !n.read ? 'bg-rose-50/50' : 'bg-white'
                  }`}
                >
                  <div className="mt-0.5">
                    {n.type === 'ALERT' || n.type === 'EMERGENCY' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ) : n.type === 'BROADCAST' ? (
                      <Radio className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Info className="w-4 h-4 text-sky-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                      </p>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0"></span>}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
