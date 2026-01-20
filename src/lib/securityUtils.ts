// Phase 6: Security & Fraud Prevention

export const generateSecureCode = (): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
};

export const isQRCodeExpired = (sessionEndTime: string): boolean => {
  return new Date(sessionEndTime) < new Date();
};

export const validateDeviceId = async (studentId: string, deviceId: string): Promise<boolean> => {
  // Store device fingerprint to prevent multi-device scanning
  const storedDevices = localStorage.getItem(`devices_${studentId}`);
  
  if (!storedDevices) {
    localStorage.setItem(`devices_${studentId}`, JSON.stringify([deviceId]));
    return true;
  }
  
  const devices = JSON.parse(storedDevices);
  if (devices.includes(deviceId)) {
    return true;
  }
  
  // Allow up to 2 devices per student
  if (devices.length < 2) {
    devices.push(deviceId);
    localStorage.setItem(`devices_${studentId}`, JSON.stringify(devices));
    return true;
  }
  
  return false;
};

export const getDeviceFingerprint = (): string => {
  // Combine multiple device characteristics for robust fingerprinting
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasFingerprint = '';
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device Fingerprint', 2, 2);
    canvasFingerprint = canvas.toDataURL();
  }
  
  // Combine multiple factors for stronger fingerprint
  const fingerprint = [
    canvasFingerprint.substring(0, 100),
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || 'unknown'
  ].join('|');
  
  return btoa(fingerprint);
};

export const preventScreenshot = (callback: () => void) => {
  // Detect if user tries to take screenshot (visibility change)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      callback();
    }
  });
  
  // Prevent right-click context menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
  
  // Detect print screen
  document.addEventListener('keyup', (e) => {
    if (e.key === 'PrintScreen') {
      callback();
    }
  });
};

// Stable, short, hashed device fingerprint to ensure non-null storage
export const getStableDeviceFingerprint = async (): Promise<string> => {
  try {
    const seed = buildDeviceFingerprintSeed();
    if (window.crypto?.subtle) {
      const enc = new TextEncoder().encode(seed);
      const digest = await crypto.subtle.digest('SHA-256', enc);
      const hashArray = Array.from(new Uint8Array(digest));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return hex; // 64-char hex
    }
    // Fallback to base64 (trim to 128 chars max)
    return btoa(seed).slice(0, 128);
  } catch {
    // Last resort: userAgent hash
    const ua = navigator.userAgent || 'unknown';
    return btoa(ua).slice(0, 64);
  }
};

function buildDeviceFingerprintSeed(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let canvasFingerprint = '';
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device Fingerprint', 2, 2);
      canvasFingerprint = canvas.toDataURL().slice(0, 64);
    }
    const parts = [
      canvasFingerprint,
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}`,
      String(new Date().getTimezoneOffset()),
      String(navigator.hardwareConcurrency || 'unknown'),
      ('storage' in navigator && 'estimate' in (navigator as any).storage) ? 'se' : 'nse',
    ];
    return parts.join('|');
  } catch {
    return `${navigator.userAgent}|${navigator.language}|${screen.width}x${screen.height}`;
  }
}
