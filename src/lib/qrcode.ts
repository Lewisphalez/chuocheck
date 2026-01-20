import QRCode from 'qrcode';

export const generateSessionCode = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
};

export const generateQRCode = async (sessionCode: string): Promise<string> => {
  try {
    const qrDataUrl = await QRCode.toDataURL(sessionCode, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

export const validateSessionCode = (code: string): boolean => {
  // Basic validation: check if code follows expected format
  const parts = code.split('-');
  return parts.length === 2 && !isNaN(Number(parts[0]));
};