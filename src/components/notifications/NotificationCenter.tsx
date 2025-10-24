import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  X, 
  Zap,
  Clock,
  Users,
  MessageSquare,
  MoreVertical,
  Check,
  Settings,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLang } from '@/hooks/useLang';
import { useAuth } from '@/hooks/useAuth';
import { notificationService, type Notification } from '@/services/notificationService';
import { toast } from 'sonner';

const NotificationCenter: React.FC = () => {
  const { t } = useTranslation(['pages', 'common']);
  const { isRTL, flexRowReverse, textStart } = useLang();
  const { user } = useAuth();

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const notificationsData = await notificationService.getUserNotifications(user.id);
      setNotifications(notificationsData || []);
      
      // Count unread notifications
      const unread = notificationsData?.filter(n => !n.read)?.length || 0;
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      if (!user?.id) return;
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  }, [user]);

  // Clear notification (local only for now)
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.read ? prev - 1 : prev;
    });
  }, [notifications]);

  // Auto-refresh effect
  useEffect(() => {
    loadNotifications();
    
    if (autoRefresh) {
      const interval = setInterval(loadNotifications, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [loadNotifications, autoRefresh]);

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    const iconProps = { className: 'h-4 w-4' };

    switch (type) {
      case 'error':
        return <AlertTriangle {...iconProps} className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle {...iconProps} className="h-4 w-4 text-green-500" />;
      case 'lead':
        return <Users {...iconProps} className="h-4 w-4 text-purple-500" />;
      case 'message':
        return <MessageSquare {...iconProps} className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <Zap {...iconProps} className="h-4 w-4 text-orange-500" />;
      default:
        return <Info {...iconProps} className="h-4 w-4 text-blue-500" />;
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notification.read;
    return notification.type === filterType;
  });

  // Format relative time
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t('Just now');
    if (minutes < 60) return t('{{minutes}}m ago', { minutes });
    if (hours < 24) return t('{{hours}}h ago', { hours });
    return t('{{days}}d ago', { days });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative ${isRTL ? 'ml-2' : 'mr-2'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className={`w-96 p-0 ${isRTL ? 'font-rubik' : ''}`}
        align={isRTL ? 'start' : 'end'}
        side="bottom"
      >
        <div className="flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-4 border-b">
            <div className={`flex items-center justify-between ${flexRowReverse}`}>
              <div className={textStart()}>
                <h3 className="font-semibold text-lg">{t('Notifications')}</h3>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 
                    ? t('{{count}} unread notifications', { count: unreadCount })
                    : t('All caught up!')
                  }
                </p>
              </div>

              <div className={`flex items-center gap-2 ${flexRowReverse}`}>
                {/* Auto-refresh toggle */}
                <div className={`flex items-center gap-1 ${flexRowReverse}`}>
                  <Switch
                    id="auto-refresh"
                    checked={autoRefresh}
                    onCheckedChange={setAutoRefresh}
                  />
                  <Label htmlFor="auto-refresh" className="text-xs">
                    {t('Auto')}
                  </Label>
                </div>

                {/* Actions menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                    <DropdownMenuItem onClick={markAllAsRead}>
                      <Check className="h-4 w-4 mr-2" />
                      {t('Mark all as read')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={loadNotifications}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('Refresh')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      {t('Notification Settings')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 py-2 border-b bg-gray-50 dark:bg-gray-800">
            <div className={`flex gap-1 ${flexRowReverse}`}>
              {[
                { key: 'all', label: t('All'), count: notifications.length },
                { key: 'unread', label: t('Unread'), count: unreadCount },
                { key: 'lead', label: t('Leads'), count: notifications.filter(n => n.type === 'lead').length },
                { key: 'message', label: t('Messages'), count: notifications.filter(n => n.type === 'message').length },
              ].map(filter => (
                <Button
                  key={filter.key}
                  variant={filterType === filter.key ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs px-2 py-1 h-auto"
                  onClick={() => setFilterType(filter.key)}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 text-xs">
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            <div className="p-1">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">{t('Loading notifications...')}</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    {filterType === 'unread' 
                      ? t('No unread notifications')
                      : t('No notifications')
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 border-0 shadow-none ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-950' : ''
                      }`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        if (notification.action_url) {
                          window.location.href = notification.action_url;
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className={`flex items-start gap-3 ${flexRowReverse}`}>
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className={`flex-1 min-w-0 ${textStart()}`}>
                            <div className={`flex items-start justify-between ${flexRowReverse}`}>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium text-gray-900 dark:text-white ${
                                  !notification.read ? 'font-semibold' : ''
                                }`}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${flexRowReverse}`}>
                                  <span>{formatTime(notification.created_at)}</span>
                                  <span>•</span>
                                  <span className="capitalize">{notification.type}</span>
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50 dark:bg-gray-800">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                }}
              >
                {t('View All Notifications')}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
