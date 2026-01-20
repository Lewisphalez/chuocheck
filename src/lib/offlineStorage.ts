// IndexedDB wrapper for offline data storage
const DB_NAME = 'ChuoCheckOfflineDB';
const DB_VERSION = 1;

interface PendingAttendance {
  sessionId: string;
  studentId: string;
  timestamp: string;
  deviceFingerprint: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const initOfflineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains('pending-attendance')) {
        db.createObjectStore('pending-attendance', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cached-sessions')) {
        db.createObjectStore('cached-sessions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cached-classes')) {
        db.createObjectStore('cached-classes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cached-attendance')) {
        db.createObjectStore('cached-attendance', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sync-queue')) {
        db.createObjectStore('sync-queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

export const addPendingAttendance = async (attendance: PendingAttendance): Promise<void> => {
  const db = await initOfflineDB();
  const transaction = db.transaction(['pending-attendance'], 'readwrite');
  const store = transaction.objectStore('pending-attendance');
  store.add(attendance);
};

export const getPendingAttendance = async (): Promise<PendingAttendance[]> => {
  const db = await initOfflineDB();
  const transaction = db.transaction(['pending-attendance'], 'readonly');
  const store = transaction.objectStore('pending-attendance');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const clearPendingAttendance = async (): Promise<void> => {
  const db = await initOfflineDB();
  const transaction = db.transaction(['pending-attendance'], 'readwrite');
  const store = transaction.objectStore('pending-attendance');
  store.clear();
};

export const cacheData = async (storeName: string, data: any): Promise<void> => {
  const db = await initOfflineDB();
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  
  if (Array.isArray(data)) {
    data.forEach(item => store.put(item));
  } else {
    store.put(data);
  }
};

export const getCachedData = async (storeName: string): Promise<any[]> => {
  const db = await initOfflineDB();
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
