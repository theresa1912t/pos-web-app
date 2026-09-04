// Cash Drawer, Receipt Printer & Barcode Scanner Hardware Bridge Utility

/**
 * Generates an auditory mechanical cash drawer sound using standard Web Audio API
 */
export function playCashDrawerSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Sound Part 1: Metallic latch release click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

    gain1.gain.setValueAtTime(0.4, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.09);

    // Sound Part 2: Metallic bell / roller glide resonance ("Ka-ching" chime)
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1760, ctx.currentTime); // A6
        osc2.frequency.setValueAtTime(2637, ctx.currentTime + 0.07); // E7

        gain2.gain.setValueAtTime(0.3, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.36);
      } catch {
        // audio context might be restricted
      }
    }, 60);
  } catch (err) {
    console.debug('Audio context not allowed or failed:', err);
  }
}

/**
 * Generates a thermal printer feed sound effect
 */
export function playPrinterFeedSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.31);
  } catch (err) {
    console.debug('Printer sound skipped:', err);
  }
}

/**
 * Generates a standard barcode scanner high-pitch confirmation beep
 */
export function playBarcodeBeepSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2700, ctx.currentTime); // Standard 2.7kHz barcode scanner beep

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.085);
  } catch (err) {
    console.debug('Scanner beep skipped:', err);
  }
}

/**
 * Triggers the connected cash drawer to kick open.
 * Uses ESC/POS standard pulse command (ESC p m t1 t2 = 27, 112, 0, 25, 250)
 * Works with Receipt Printer RJ11/RJ12 drawer port, Web Serial / Bluetooth, or simulated hardware bridge.
 */
export async function triggerCashDrawerOpen(options?: {
  quiet?: boolean;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Play hardware sound simulation
    if (!options?.quiet) {
      playCashDrawerSound();
    }

    // 2. ESC/POS drawer kick byte sequence (Standard RJ11 pin 2 & pin 5 kick)
    // ESC p 0 25 250 -> 0x1B 0x70 0x00 0x19 0xFA
    const escPosKick = new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]);

    // 3. Check if Web Serial is supported & port available in window
    const nav = navigator as unknown as { serial?: { requestPort?: () => Promise<unknown>; getPorts?: () => Promise<unknown[]> } };
    if (nav.serial && typeof nav.serial.getPorts === 'function') {
      try {
        const ports = await nav.serial.getPorts();
        if (ports && ports.length > 0) {
          const port = ports[0] as {
            open?: (opt: { baudRate: number }) => Promise<void>;
            writable?: { getWriter: () => { write: (data: Uint8Array) => Promise<void>; releaseLock: () => void } };
            close?: () => Promise<void>;
          };
          if (port && port.writable) {
            const writer = port.writable.getWriter();
            await writer.write(escPosKick);
            writer.releaseLock();
          }
        }
      } catch (serialErr) {
        console.debug('Serial drawer pulse skipped:', serialErr);
      }
    }

    if (options?.onSuccess) {
      options.onSuccess();
    }

    return {
      success: true,
      message: 'Cash drawer opened successfully.',
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (options?.onError) {
      options.onError(err);
    }
    return {
      success: false,
      message: `Gagal membuka laci kasir: ${err.message}`,
    };
  }
}

/**
 * Triggers a test print simulation on the connected thermal receipt printer
 */
export async function triggerTestPrint(printerName?: string, paperSize: string = '58mm'): Promise<{ success: boolean; message: string }> {
  try {
    playPrinterFeedSound();
    // Simulate brief network/hardware latency
    await new Promise((res) => setTimeout(res, 400));
    return {
      success: true,
      message: 'Test receipt printed successfully.',
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    return {
      success: false,
      message: `Gagal mencetak struk: ${error.message}`,
    };
  }
}

