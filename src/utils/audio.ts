/**
 * Audio Synthesizer using Web Audio API
 * High performance, zero external audio asset latency, works fully offline.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.8;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public playTone(freq: number, duration: number, type: OscillatorType = 'square', vol: number = 0.08, slide: number = 0) {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slide !== 0) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
      }

      const finalVol = vol * this.volume;
      gain.gain.setValueAtTime(finalVol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + duration);
    } catch {
      // AudioContext policy catch
    }
  }

  public shoot() {
    this.playTone(720, 0.08, 'square', 0.04, -450);
  }

  public shotgun() {
    this.playTone(480, 0.12, 'sawtooth', 0.07, -350);
    this.playTone(240, 0.14, 'square', 0.06, -180);
  }

  public laser() {
    this.playTone(980, 0.1, 'sine', 0.06, -600);
  }

  public key() {
    this.playTone(660, 0.14, 'triangle', 0.1);
    setTimeout(() => this.playTone(990, 0.22, 'triangle', 0.1), 110);
    setTimeout(() => this.playTone(1320, 0.25, 'triangle', 0.1), 220);
  }

  public hurt() {
    this.playTone(160, 0.22, 'sawtooth', 0.11, -90);
  }

  public kill() {
    this.playTone(320, 0.14, 'triangle', 0.09, -220);
  }

  public enter() {
    this.playTone(180, 0.7, 'sine', 0.12, 500);
  }

  public pick() {
    this.playTone(440, 0.09, 'square', 0.09);
    setTimeout(() => this.playTone(660, 0.11, 'square', 0.09), 80);
    setTimeout(() => this.playTone(880, 0.18, 'triangle', 0.09), 170);
  }

  public heal() {
    this.playTone(520, 0.2, 'sine', 0.09, 300);
  }

  public bomb() {
    this.playTone(70, 0.6, 'sawtooth', 0.18, -40);
    this.playTone(220, 0.35, 'square', 0.12, -160);
  }

  public bossDie() {
    [0, 1, 2, 3, 4].forEach((i) => {
      setTimeout(() => this.playTone(440 - i * 65, 0.4, 'sawtooth', 0.12, -150), i * 160);
    });
  }

  public levelUp() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.25, 'triangle', 0.14), idx * 100);
    });
  }

  public click() {
    this.playTone(500, 0.04, 'sine', 0.04);
  }

  public purchase() {
    this.playTone(600, 0.1, 'sine', 0.08);
    setTimeout(() => this.playTone(900, 0.18, 'triangle', 0.1), 80);
  }

  public victory() {
    const fanfare = [
      { f: 523, d: 0.15, t: 0 },
      { f: 523, d: 0.15, t: 150 },
      { f: 523, d: 0.15, t: 300 },
      { f: 659, d: 0.35, t: 450 },
      { f: 783, d: 0.25, t: 750 },
      { f: 1046, d: 0.6, t: 950 },
    ];
    fanfare.forEach((n) => {
      setTimeout(() => this.playTone(n.f, n.d, 'triangle', 0.15), n.t);
    });
  }
}

export const sound = new SoundEngine();
