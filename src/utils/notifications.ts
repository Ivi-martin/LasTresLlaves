/**
 * Push Notification Service
 * Manages Web Notifications API and daily reminder timers
 */

export interface ToastMessage {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'reward' | 'level' | 'challenge';
}

class NotificationService {
  private listeners: ((toast: ToastMessage) => void)[] = [];

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      this.emitToast('Notificaciones no soportadas', 'Este navegador no admite notificaciones de escritorio.', 'info');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.emitToast('¡Notificaciones Activadas!', 'Recibirás avisos para mantener tu racha diaria y desafíos.', 'reward');
        this.sendSystemNotification('Las Tres Llaves', {
          body: '¡Listo! Te avisaremos cuando tu recompensa diaria esté disponible.',
          icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffd23f"%3E%3Cpath d="M7 14c-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2v1.17c1.16.42 2 1.52 2 2.83 0 1.66-1.34 3-3 3z"/%3E%3C/svg%3E',
        });
      }
      return permission;
    } catch {
      return 'denied';
    }
  }

  public sendSystemNotification(title: string, options?: NotificationOptions) {
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffd23f"%3E%3Cpath d="M7 14c-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2v1.17c1.16.42 2 1.52 2 2.83 0 1.66-1.34 3-3 3z"/%3E%3C/svg%3E',
          badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ffd23f"%3E%3Cpath d="M7 14c-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2v1.17c1.16.42 2 1.52 2 2.83 0 1.66-1.34 3-3 3z"/%3E%3C/svg%3E',
          ...options,
        });
      } catch {
        // Fallback to in-app toast
      }
    }
    // Always dispatch in-app toast as well for seamless UX
    this.emitToast(title, options?.body || '', 'info');
  }

  public sendDailyStreakReminder(dayNumber: number) {
    this.sendSystemNotification('¡Tu recompensa diaria te espera!', {
      body: `Día ${dayNumber}: No pierdas tu racha. Entra ahora para reclamar oro y accesorios exclusivos.`,
    });
  }

  public sendWeeklyChallengeAlert(challengeTitle: string) {
    this.sendSystemNotification('¡Nuevo Desafío Semanal!', {
      body: `Misión activa: "${challengeTitle}". ¡Completa objetivos y gana recompensas legendarias!`,
    });
  }

  public onToast(listener: (toast: ToastMessage) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public emitToast(title: string, body: string, type: ToastMessage['type'] = 'info') {
    const toast: ToastMessage = {
      id: 'toast_' + Math.random().toString(36).substring(2, 9),
      title,
      body,
      type,
    };
    this.listeners.forEach((l) => l(toast));
  }
}

export const notificationService = new NotificationService();
