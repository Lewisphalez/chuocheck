export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (!('Notification' in window) || typeof Notification === 'undefined') {
      console.warn('Notifications not supported in this environment');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  } catch (error) {
    console.warn('Error requesting notification permission:', error);
  }

  return false;
};

export const sendNotification = (title: string, options?: NotificationOptions) => {
  try {
    if (typeof Notification === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not available');
      return;
    }
    
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  } catch (error) {
    console.warn('Error sending notification:', error);
  }
};

export const notifySessionActive = (className: string, duration: number) => {
  sendNotification('Attendance Session Active', {
    body: `${className} - Session expires in ${duration} minutes`,
    tag: 'session-active',
    requireInteraction: true,
  });
};
