// Web Audio API Synthesizer for Paper, Writing, and Ambient Sounds

class SoundController {
  private ctx: AudioContext | null = null;
  private ambientNode: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  public isMuted: boolean = false;
  public typingSoundEnabled: boolean = true;
  public ambientType: 'none' | 'rain' | 'fireplace' = 'none';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Realistic paper turn / rustle sound
  playPageTurn() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      // Create noise buffer for paper friction
      const bufferSize = ctx.sampleRate * 0.45; // 450ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Filter to simulate paper frequency
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.45);
      filter.Q.value = 1.2;

      // Gain envelope for swish
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.45);
    } catch {
      // Audio context might be restricted before first click
    }
  }

  // Realistic fountain pen scratching / typewriter keystroke sound
  playKeySound(type: 'fountain' | 'typewriter' | 'pencil' = 'fountain') {
    if (this.isMuted || !this.typingSoundEnabled) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;

      if (type === 'typewriter') {
        // Mechanical clack
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + Math.random() * 120, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else {
        // Fountain pen or pencil scratch: high frequency short noise burst
        const bufferSize = Math.floor(ctx.sampleRate * 0.035); // 35ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(type === 'fountain' ? 2400 + Math.random() * 400 : 1800 + Math.random() * 300, now);
        filter.Q.value = 3.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.035);
      }
    } catch {
      // Audio context might be restricted before first click
    }
  }

  // Ambient sound synthesis (Rain & Fireplace)
  setAmbient(type: 'none' | 'rain' | 'fireplace') {
    this.ambientType = type;
    if (this.ambientNode) {
      try {
        if ('stop' in this.ambientNode) {
          (this.ambientNode as AudioScheduledSourceNode).stop();
        }
        this.ambientNode.disconnect();
      } catch {
        // ignore
      }
      this.ambientNode = null;
    }

    if (type === 'none' || this.isMuted) return;

    try {
      const ctx = this.initContext();
      const bufferSize = ctx.sampleRate * 2; // 2 seconds looping buffer
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink/Brownish noise generation
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        gain.gain.value = 0.22;
      } else {
        // Fireplace
        filter.type = 'lowpass';
        filter.frequency.value = 550;
        gain.gain.value = 0.28;
      }

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      this.ambientGain = gain;
      this.ambientNode = noise;
      noise.start();
    } catch {
      // Audio context might be restricted before first click
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } else {
      if (this.ambientType !== 'none') {
        this.setAmbient(this.ambientType);
      }
    }
    return this.isMuted;
  }
}

export const sounds = new SoundController();
