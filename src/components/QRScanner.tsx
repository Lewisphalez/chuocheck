import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './ui/button';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          () => {
            // Error callback - can be ignored for scan failures
          }
        );

        setHasPermission(true);
      } catch (err: any) {
        setError(err.message || 'Failed to start camera');
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 py-8 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Scan QR Code</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="w-6 h-6" />
          </Button>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Camera className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-destructive text-center mb-4">{error}</p>
            <p className="text-muted-foreground text-center text-sm">
              Please allow camera access to scan QR codes
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div id="qr-reader" className="w-full max-w-md"></div>
            <p className="mt-4 text-muted-foreground text-center">
              Point your camera at the QR code
            </p>
          </div>
        )}
      </div>
    </div>
  );
};