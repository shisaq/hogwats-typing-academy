// Specialized Sound Effects Service for Hogwarts Typing Academy
// Highly optimized for Safari and mobile browser compatibility

class SoundEffects {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted = false;
  private buffers: Map<string, AudioBuffer> = new Map();
  private lastKeyClickTime = 0;
  private readonly keyClickInterval = 45;

  constructor() {
    // We don't initialize here to stay within user gesture requirements
  }

  /**
   * Safe initialization of AudioContext.
   * MUST be called directly within a user-triggered event handler.
   */
  private init(): boolean {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }

    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return false;

      this.ctx = new AudioContextClass();
      const ctx = this.ctx!;

      // Master Gain
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.4, ctx.currentTime);
      this.masterGain.connect(ctx.destination);

      // SFX Gain
      this.sfxGain = ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.5, ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Pre-generate sounds
      this.generateBuffers();

      // Safari "Unlock" - play a tiny silent oscillator
      // This is the most reliable way to enable Web Audio on iOS/Safari
      const osc = ctx.createOscillator();
      const silentGain = ctx.createGain();
      silentGain.gain.setValueAtTime(0, ctx.currentTime);
      osc.connect(silentGain);
      silentGain.connect(ctx.destination);
      osc.start(0);
      osc.stop(0.01);

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      return true;
    } catch (e) {
      console.warn('Audio initialization failed:', e);
      return false;
    }
  }

  private generateBuffers() {
    if (!this.ctx) return;
    const sr = this.ctx.sampleRate;
    this.buffers.set('keyClick', this.createTone(880, 0.08, 25));
    this.buffers.set('error', this.createNoise(0.2, 8));
    this.buffers.set('wordComplete', this.createChord());
    this.buffers.set('buttonClick', this.createTone(440, 0.1, 20));
    this.buffers.set('streakBonus', this.createArpeggio());
  }

  private createTone(freq: number, dur: number, decay: number): AudioBuffer {
    const sr = this.ctx!.sampleRate;
    const samples = Math.ceil(dur * sr);
    const buf = this.ctx!.createBuffer(1, samples, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      const t = i / sr;
      data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * decay) * 0.5;
    }
    return buf;
  }

  private createNoise(dur: number, decay: number): AudioBuffer {
    const sr = this.ctx!.sampleRate;
    const samples = Math.ceil(dur * sr);
    const buf = this.ctx!.createBuffer(1, samples, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      const t = i / sr;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay) * 0.3;
    }
    return buf;
  }

  private createChord(): AudioBuffer {
    const sr = this.ctx!.sampleRate;
    const dur = 0.5;
    const freqs = [523.25, 659.25, 783.99];
    const samples = Math.ceil(dur * sr);
    const buf = this.ctx!.createBuffer(1, samples, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      const t = i / sr;
      let val = 0;
      freqs.forEach((f, idx) => {
        const d = idx * 0.05;
        if (t >= d) val += Math.sin(2 * Math.PI * f * (t - d)) * 0.2 * Math.exp(-(t - d) * 5);
      });
      data[i] = val;
    }
    return buf;
  }

  private createArpeggio(): AudioBuffer {
    const sr = this.ctx!.sampleRate;
    const dur = 0.4;
    const freqs = [880, 1108, 1318, 1760];
    const samples = Math.ceil(dur * sr);
    const buf = this.ctx!.createBuffer(1, samples, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      const t = i / sr;
      let val = 0;
      freqs.forEach((f, idx) => {
        const d = idx * 0.04;
        if (t >= d) val += Math.sin(2 * Math.PI * f * (t - d)) * 0.15 * Math.exp(-(t - d) * 10);
      });
      data[i] = val;
    }
    return buf;
  }

  // SAFARI FIX: This method must be called SYNCHRONOUSLY within a user gesture handler
  // (e.g., onKeyDown, onClick). Safari requires AudioContext operations to be in the
  // same call stack as the user event.
  public playSound(name: string, throttleMs: number = 0) {
    if (this.isMuted) return;

    // CRITICAL: Synchronous init within user gesture for Safari
    if (!this.ctx) {
      this.init();
    }

    if (!this.ctx || !this.sfxGain) return;

    const buffer = this.buffers.get(name);
    if (!buffer) return;

    // Throttling
    if (throttleMs > 0) {
      const now = performance.now();
      if (now - this.lastKeyClickTime < throttleMs) return;
      this.lastKeyClickTime = now;
    }

    // Safari: Must check state and resume synchronously if possible
    if (this.ctx.state === 'suspended') {
      // Try synchronous resume first (works in some browsers)
      this.ctx.resume().then(() => {
        // Play after resume completes
        this.doPlay(buffer);
      }).catch(() => {
        // Fallback: try to play anyway
        this.doPlay(buffer);
      });
      return;
    }

    // Normal play
    this.doPlay(buffer);
  }

  private doPlay(buffer: AudioBuffer) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.sfxGain);
      source.start(0);
    } catch (e) {
      // Ignore play errors
    }
  }

  // Helper methods
  public playKeyClick() { this.playSound('keyClick', this.keyClickInterval); }
  public playError() { this.playSound('error'); }
  public playWordComplete() { this.playSound('wordComplete'); }
  public playButtonClick() { this.playSound('buttonClick'); }
  public playStreakBonus() { this.playSound('streakBonus'); }
  public playLevelWin() { 
    this.playWordComplete(); 
    setTimeout(() => this.playStreakBonus(), 250);
  }
  public playLevelStart() { 
    this.playButtonClick();
    setTimeout(() => this.playKeyClick(), 120);
  }
  public playNotification() { this.playButtonClick(); }
  public playSpellFail() { this.playError(); }
  public playHouseReveal(h: string) { this.playStreakBonus(); }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.4, this.ctx.currentTime);
    }
  }

  public resume() {
    if (this.ctx) {
      this.ctx.resume().catch(() => {});
    } else {
      this.init();
    }
  }

  public warmup() {
    this.init();
  }

  public getContext(): AudioContext | null {
    if (!this.ctx) this.init();
    return this.ctx;
  }
}

export const soundEffects = new SoundEffects();
