import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { requestNotificationPermission, subscribeToPushNotifications, unsubscribeFromPushNotifications } from '@/lib/pushNotifications';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    try {
      if (typeof Notification !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    } catch (error) {
      console.warn('Notification API not available:', error);
    }
  }, []);

  const subscribe = async () => {
    if (!user) return;
    
    try {
      const granted = await requestNotificationPermission();
      if (typeof Notification !== 'undefined') {
        setPermission(Notification.permission);
      }
      
      if (granted) {
        await subscribeToPushNotifications(user.id);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.warn('Error subscribing to notifications:', error);
    }
  };

  const unsubscribe = async () => {
    if (!user) return;
    
    await unsubscribeFromPushNotifications(user.id);
    setIsSubscribed(false);
  };

  return {
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
  };
};
