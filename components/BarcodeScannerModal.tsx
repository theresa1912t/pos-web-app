'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useApp } from '@/context/AppContext';
import {
  X,
  Camera,
  FlipHorizontal,
  Zap,
  ZapOff,
  AlertCircle,
  Keyboard,
  CheckCircle2,
  Barcode,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  title?: string;
  subtitle?: string;
}

// Play pleasant cash register scanner beep using Web Audio API
function playScanBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch crisp beep (A6)
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Ignore audio autoplay/context restrictions silently
  }
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Scan Barcode Produk',
  subtitle = 'Arahkan kamera ke barcode 1D atau QR Code pada kemasan produk',
}: BarcodeScannerModalProps) {
  const { products } = useApp();
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);
  const containerId = 'interactive-barcode-reader';
  const lastScanTimestamp = useRef<number>(0);

  // Sample barcodes for quick testing or when hardware camera is not connected
  const sampleBarcodes = useMemo(() => {
    const fromProducts = products
      .filter((p) => Boolean(p.barcode) && !p.isArchived)
      .map((p) => ({ name: p.name, barcode: p.barcode! }));

    const defaults = [
      { name: 'Indomie Goreng', barcode: '8992388101015' },
      { name: 'Aqua 600ml', barcode: '8998866200223' },
      { name: 'Teh Botol Sosro', barcode: '8992761111006' },
      { name: 'Kopi Kapal Api', barcode: '8991001112233' },
    ];

    const combined = [...fromProducts, ...defaults];
    const unique = new Map<string, { name: string; barcode: string }>();
    combined.forEach((item) => {
      if (!unique.has(item.barcode)) {
        unique.set(item.barcode, item);
      }
    });

    return Array.from(unique.values()).slice(0, 5);
  }, [products]);

  // Stop scanner safely
  const stopScanner = useCallback(async () => {
    if (isStoppingRef.current) return;
    if (scannerRef.current && scannerRef.current.isScanning) {
      isStoppingRef.current = true;
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Scanner stop error:', err);
      } finally {
        isStoppingRef.current = false;
        setIsScanning(false);
      }
    }
  }, []);

  // Handle scanned code
  const handleDecodedText = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      // Debounce rapid duplicates within 1.2s
      if (now - lastScanTimestamp.current < 1200 && decodedText === lastScannedCode) {
        return;
      }
      lastScanTimestamp.current = now;
      const cleanCode = decodedText.trim();
      if (!cleanCode) return;

      setLastScannedCode(cleanCode);
      if (soundEnabled) {
        playScanBeep();
      }

      onScanSuccess(cleanCode);
    },
    [lastScannedCode, soundEnabled, onScanSuccess]
  );

  // Initialize and start scanner with graceful fallback cascade
  const startScanner = useCallback(
    async (cameraId?: string) => {
      setCameraError(null);
      await stopScanner();

      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF,
        ];

        const containerEl = document.getElementById(containerId);
        if (!containerEl) return;

        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxWidth = Math.floor(minEdge * 0.82);
            const qrboxHeight = Math.floor(minEdge * 0.45);
            return { width: Math.max(qrboxWidth, 220), height: Math.max(qrboxHeight, 130) };
          },
          aspectRatio: 1.333334,
        };

        // Fallback sequence: specified camera -> environment camera -> user camera -> unconstrained
        const attempts = cameraId
          ? [{ deviceId: { exact: cameraId } }, { facingMode: 'environment' }, { facingMode: 'user' }]
          : [{ facingMode: 'environment' }, { facingMode: 'user' }, {} as any];

        let started = false;
        let lastErr: any = null;

        for (const cameraConfig of attempts) {
          try {
            await html5QrCode.start(
              cameraConfig,
              config,
              (decodedText) => {
                handleDecodedText(decodedText);
              },
              () => {
                // Frame scan failure is expected when no barcode in view
              }
            );
            started = true;
            break;
          } catch (attemptErr: any) {
            lastErr = attemptErr;
            const errStr = String(attemptErr?.message || attemptErr || '');
            if (
              attemptErr?.name === 'NotAllowedError' ||
              errStr.includes('Permission') ||
              errStr.includes('denied')
            ) {
              // User or browser explicitly denied camera permissions
              break;
            }
          }
        }

        if (!started) {
          throw lastErr || new Error('Kamera tidak dapat dimulai.');
        }

        setIsScanning(true);

        // Check if torch/flashlight is supported
        try {
          const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
          if (capabilities && (capabilities as any).torchFeature?.isSupported?.()) {
            setTorchSupported(true);
          } else {
            setTorchSupported(false);
          }
        } catch {
          setTorchSupported(false);
        }
      } catch (err: any) {
        // Use console.warn to log without triggering unhandled error telemetry
        console.warn('Camera start issue (switching to manual/sample mode):', err?.message || err);
        let msg = 'Tidak dapat mengakses kamera perangkat.';
        const errStr = String(err?.message || err || '');
        if (err?.name === 'NotAllowedError' || errStr.includes('Permission') || errStr.includes('denied')) {
          msg = 'Izin kamera ditolak di peramban Anda. Silakan izinkan akses kamera di pengaturan browser.';
        } else if (
          err?.name === 'NotFoundError' ||
          errStr.includes('NotFound') ||
          errStr.includes('Requested device not found')
        ) {
          msg = 'Perangkat kamera tidak ditemukan pada komputer/perangkat Anda.';
        }
        setCameraError(msg);
        setShowManualInput(true);
      }
    },
    [handleDecodedText, stopScanner]
  );

  // Discover cameras on mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadCameras() {
      if (typeof window === 'undefined') return;

      // 1. Check if mediaDevices API is supported in this browser
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        if (isMounted) {
          setCameraError('Peramban tidak mendukung akses kamera langsung.');
          setShowManualInput(true);
        }
        return;
      }

      // 2. Pre-check if any video input device physically exists
      try {
        if (typeof navigator.mediaDevices.enumerateDevices === 'function') {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = deviceList.filter((d) => d.kind === 'videoinput');
          if (deviceList.length > 0 && videoInputs.length === 0) {
            // Hardware has devices but no camera attached
            if (isMounted) {
              setCameraError('Perangkat kamera tidak ditemukan pada komputer/perangkat Anda.');
              setShowManualInput(true);
            }
            return;
          }
        }
      } catch {
        // EnumerateDevices precheck failed; proceed to getCameras attempt
      }

      // 3. Query cameras via Html5Qrcode
      try {
        const devices = await Html5Qrcode.getCameras();
        if (isMounted && devices && devices.length > 0) {
          setCameras(devices);
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('belakang') ||
              d.label.toLowerCase().includes('environment') ||
              d.label.toLowerCase().includes('rear')
          );
          const chosen = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosen);
          startScanner(chosen);
        } else if (isMounted) {
          setCameraError('Kamera tidak ditemukan pada perangkat Anda.');
          setShowManualInput(true);
        }
      } catch (err: any) {
        const errStr = String(err?.message || err || '');
        const isNotFound =
          err?.name === 'NotFoundError' ||
          errStr.includes('NotFound') ||
          errStr.includes('Requested device not found');
        const isPermission =
          err?.name === 'NotAllowedError' ||
          errStr.includes('Permission') ||
          errStr.includes('denied');

        if (isMounted) {
          if (isNotFound) {
            setCameraError('Perangkat kamera tidak ditemukan pada komputer/perangkat Anda.');
          } else if (isPermission) {
            setCameraError('Izin kamera ditolak di peramban Anda.');
          } else {
            setCameraError('Kamera tidak dapat diakses saat ini.');
          }
          setShowManualInput(true);
        }
      }
    }

    loadCameras();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  // Toggle Torch/Flashlight
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const nextTorch = !torchEnabled;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchEnabled(nextTorch);
    } catch (err) {
      console.warn('Toggle torch failed:', err);
    }
  };

  // Switch camera
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCam = cameras[nextIndex];
    setSelectedCameraId(nextCam.id);
    startScanner(nextCam.id);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const code = manualInput.trim();
    if (soundEnabled) playScanBeep();
    onScanSuccess(code);
    setManualInput('');
  };

  const handleSampleClick = (code: string) => {
    if (soundEnabled) playScanBeep();
    setLastScannedCode(code);
    onScanSuccess(code);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{title}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-1">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara Beep' : 'Aktifkan Suara Beep'}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-teal-400 hover:bg-slate-700'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Viewport & Overlay */}
        <div className="relative bg-black flex-1 min-h-[260px] sm:min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* HTML5 QR Container */}
          <div id={containerId} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

          {/* Scanner Targeting Frame Graphic Overlay */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              <div className="relative w-64 sm:w-72 h-36 sm:h-40 border-2 border-teal-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Target Corners */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-teal-400 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-teal-400 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-teal-400 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-teal-400 rounded-br-lg" />

                {/* Animated Red Scanning Laser Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e] animate-pulse top-1/2 -translate-y-1/2" />
              </div>

              <div className="mt-4 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-xs border border-slate-700 text-[11px] text-slate-300 font-medium">
                Posisikan garis merah tepat di atas barcode
              </div>
            </div>
          )}

          {/* Camera Error / Not Available Notice */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center space-y-3 z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="max-w-xs space-y-1">
                <h4 className="text-sm font-semibold text-slate-200">Kamera Tidak Tersedia</h4>
                <p className="text-xs text-slate-400">{cameraError}</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startScanner(selectedCameraId || undefined)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Coba Lagi
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Gunakan Input Barcode
                </button>
              </div>
            </div>
          )}

          {/* Top In-Camera Controls Overlay (Torch, Switch Camera) */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-20">
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700 text-slate-300 text-xs backdrop-blur-xs transition-colors cursor-pointer"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Ganti Kamera</span>
              </button>
            )}

            {torchSupported && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs backdrop-blur-xs transition-colors cursor-pointer ${
                  torchEnabled
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-700 text-slate-300'
                }`}
              >
                {torchEnabled ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
                <span>{torchEnabled ? 'Lampu Nyala' : 'Lampu'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section: Feedback, Quick Samples & Manual Barcode Input Fallback */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {/* Last scanned feedback pill */}
          {lastScannedCode && (
            <div className="p-2.5 rounded-xl bg-teal-950/60 border border-teal-800/80 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400">Terbaca: </span>
                  <span className="font-mono font-bold text-teal-300">{lastScannedCode}</span>
                </div>
              </div>
              <span className="text-[10px] text-teal-400 bg-teal-900/50 px-2 py-0.5 rounded-md font-semibold">
                OK
              </span>
            </div>
          )}

          {/* Quick Simulation / Testing Barcode Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Simulasi Cepat (Klik barcode produk untuk mencoba):</span>
            </div>
            <div className="flex items-center flex-wrap gap-1.5">
              {sampleBarcodes.map((item) => (
                <button
                  key={item.barcode}
                  type="button"
                  onClick={() => handleSampleClick(item.barcode)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500/50 text-slate-300 hover:text-white rounded-lg text-[11px] transition-all cursor-pointer flex items-center space-x-1"
                  title={`Barcode: ${item.barcode}`}
                >
                  <Barcode className="w-3 h-3 text-teal-400" />
                  <span className="truncate max-w-[130px]">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Manual Input */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="flex items-center space-x-1.5 text-xs text-teal-400 hover:text-teal-300 font-medium cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>{showManualInput ? 'Sembunyikan Input Manual' : 'Ketik Barcode Manual / Scanner USB'}</span>
            </button>
          </div>

          {/* Manual Input Form */}
          {showManualInput && (
            <form onSubmit={handleManualSubmit} className="flex items-center space-x-2 pt-1">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ketik atau scan barcode di sini..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Gunakan
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
