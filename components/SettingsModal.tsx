import React, { useState, useEffect } from 'react';
import { GameSettings, GraphicQuality, PlayerStats } from '../types/game';
import { StorageManager } from '../utils/storage';
import { sound } from '../utils/audio';
import { notificationService } from '../utils/notifications';

interface SettingsModalProps {
  settings: GameSettings;
  stats: PlayerStats;
  onSettingsChange: (newSettings: GameSettings) => void;
  onStatsChange: (newStats: PlayerStats) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  stats,
  onSettingsChange,
  onStatsChange,
  onClose,
}) => {
  const [currentSettings, setCurrentSettings] = useState<GameSettings>(settings);
  const [currentStats, setCurrentStats] = useState<PlayerStats>(stats);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    notificationService.getPermissionStatus()
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleQualityChange = (q: GraphicQuality) => {
    sound.click();
    const updated = { ...currentSettings, quality: q };
    setCurrentSettings(updated);
    StorageManager.saveSettings(updated);
    onSettingsChange(updated);
  };

  const handleToggleFps = () => {
    sound.click();
    const updated = { ...currentSettings, showFps: !currentSettings.showFps };
    setCurrentSettings(updated);
    StorageManager.saveSettings(updated);
    onSettingsChange(updated);
  };

  const handleToggleSound = () => {
    const updated = { ...currentSettings, soundEnabled: !currentSettings.soundEnabled };
    sound.setEnabled(updated.soundEnabled);
    setCurrentSettings(updated);
    StorageManager.saveSettings(updated);
    onSettingsChange(updated);
  };

  const handleVolumeChange = (v: number) => {
    const updated = { ...currentSettings, soundVolume: v };
    sound.setVolume(v);
    setCurrentSettings(updated);
    StorageManager.saveSettings(updated);
    onSettingsChange(updated);
  };

  const handleRequestPushNotifications = async () => {
    const perm = await notificationService.requestPermission();
    setNotifPermission(perm);
  };

  const handleTestNotification = () => {
    sound.pick();
    notificationService.sendSystemNotification('Las Tres Llaves: Récord Diario', {
      body: '¡Hola aventurero! Esta es una notificación push de prueba. Tu progreso diario está a salvo.',
    });
  };

  // RPG Upgrade Purchase
  const handleUpgrade = (type: keyof PlayerStats['upgrades'], cost: number) => {
    if (currentStats.gold < cost) return;

    sound.purchase();
    const updatedStats: PlayerStats = {
      ...currentStats,
      gold: currentStats.gold - cost,
      upgrades: {
        ...currentStats.upgrades,
        [type]: currentStats.upgrades[type] + 1,
      },
    };

    setCurrentStats(updatedStats);
    StorageManager.saveStats(updatedStats);
    onStatsChange(updatedStats);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#1b221a] to-[#0e130f] border-2 border-amber-600 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-600/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-amber-400 tracking-wide">
                AJUSTES Y MEJORAS
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                Optimización para gama baja, modo offline, notificaciones y atributos RPG.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.click();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto pr-1 flex-1">
          {/* Section 1: Low-end Performance & Graphics */}
          <div className="bg-black/40 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>🚀</span> RENDIMIENTO Y GRÁFICOS (GAMA BAJA)
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Selecciona el perfil adecuado según la potencia de tu procesador y pantalla.
            </p>

            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <button
                onClick={() => handleQualityChange('low')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  currentSettings.quality === 'low'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <span>⚡ Baja (Gama Baja)</span>
                <span className="text-[10px] font-normal opacity-80">60 FPS Ultra Fluido</span>
              </button>

              <button
                onClick={() => handleQualityChange('medium')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  currentSettings.quality === 'medium'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <span>⚖️ Equilibrada</span>
                <span className="text-[10px] font-normal opacity-80">Estándar</span>
              </button>

              <button
                onClick={() => handleQualityChange('high')}
                className={`p-2.5 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 cursor-pointer ${
                  currentSettings.quality === 'high'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <span>🌟 Alta / Ultra</span>
                <span className="text-[10px] font-normal opacity-80">Efectos Completos</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-300">Mostrar Contador de FPS en pantalla</span>
              <button
                onClick={handleToggleFps}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentSettings.showFps ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentSettings.showFps ? 'Activado' : 'Desactivado'}
              </button>
            </div>
          </div>

          {/* Section 2: Push Notifications */}
          <div className="bg-black/40 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>🔔</span> NOTIFICACIONES PUSH DIARIAS
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Recibe avisos automáticos en tu navegador o móvil para reclamar recompensas diarias y nuevos desafíos.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-xs font-mono font-bold text-slate-300 block">
                  Permiso del Navegador:{' '}
                  <span
                    className={
                      notifPermission === 'granted'
                        ? 'text-emerald-400'
                        : notifPermission === 'denied'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }
                  >
                    {notifPermission === 'granted'
                      ? 'CONCEDIDO (Activo)'
                      : notifPermission === 'denied'
                      ? 'BLOQUEADO'
                      : 'PENDIENTE DE ACTIVAR'}
                  </span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {notifPermission === 'granted'
                    ? 'Todo listo. El sistema te recordará diariamente.'
                    : 'Haz clic en el botón para permitir notificaciones push.'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {notifPermission !== 'granted' && (
                  <button
                    onClick={handleRequestPushNotifications}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                  >
                    Permitir Notificaciones
                  </button>
                )}
                <button
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition cursor-pointer"
                >
                  Probar Ahora
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Offline Mode & PWA Status */}
          <div className="bg-black/40 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>📶</span> MODO OFFLINE Y DISPONIBILIDAD
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  {isOnline ? '🟢 Conexión a Internet: Activa' : '🟡 Modo Offline: Jugando Sin Conexión'}
                </span>
                <span className="text-[11px] text-slate-400">
                  El juego está completamente empaquetado para funcionar sin red. Tu progreso, niveles y oro se sincronizan automáticamente.
                </span>
              </div>
              <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded font-bold border border-emerald-500/30">
                PWA Lista
              </span>
            </div>
          </div>

          {/* Section 4: Audio */}
          <div className="bg-black/40 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>🔊</span> AUDIO Y EFECTOS
            </h3>

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-300">Efectos de Sonido Sintetizados</span>
              <button
                onClick={handleToggleSound}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  currentSettings.soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {currentSettings.soundEnabled ? 'Activado' : 'Silenciado'}
              </button>
            </div>

            {currentSettings.soundEnabled && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Volumen:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentSettings.soundVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
                <span className="text-xs font-mono text-slate-300 w-10 text-right">
                  {Math.round(currentSettings.soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Section 5: RPG Stats Upgrades */}
          <div className="bg-black/40 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <span>⚔️</span> MAESTRÍA Y MEJORAS DE ATRIBUTOS
              </h3>
              <span className="text-xs font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded font-bold">
                🪙 {currentStats.gold} Oro
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Max HP Upgrade */}
              {(() => {
                const cost = 150 + currentStats.upgrades.maxHp * 80;
                const canBuy = currentStats.gold >= cost;
                return (
                  <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Salud Máxima</span>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        +{currentStats.upgrades.maxHp * 10} HP (Nv. {currentStats.upgrades.maxHp})
                      </span>
                    </div>
                    <button
                      onClick={() => handleUpgrade('maxHp', cost)}
                      disabled={!canBuy}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono transition cursor-pointer ${
                        canBuy
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {cost} 🪙
                    </button>
                  </div>
                );
              })()}

              {/* Move Speed Upgrade */}
              {(() => {
                const cost = 160 + currentStats.upgrades.moveSpeed * 90;
                const canBuy = currentStats.gold >= cost;
                return (
                  <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Velocidad de Movimiento</span>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        +{currentStats.upgrades.moveSpeed * 4}% (Nv. {currentStats.upgrades.moveSpeed})
                      </span>
                    </div>
                    <button
                      onClick={() => handleUpgrade('moveSpeed', cost)}
                      disabled={!canBuy}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono transition cursor-pointer ${
                        canBuy
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {cost} 🪙
                    </button>
                  </div>
                );
              })()}

              {/* Weapon Damage Upgrade */}
              {(() => {
                const cost = 200 + currentStats.upgrades.damage * 100;
                const canBuy = currentStats.gold >= cost;
                return (
                  <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Potencia de Armas</span>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        +{currentStats.upgrades.damage * 5}% (Nv. {currentStats.upgrades.damage})
                      </span>
                    </div>
                    <button
                      onClick={() => handleUpgrade('damage', cost)}
                      disabled={!canBuy}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono transition cursor-pointer ${
                        canBuy
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {cost} 🪙
                    </button>
                  </div>
                );
              })()}

              {/* Starting Bombs Upgrade */}
              {(() => {
                const cost = 250 + currentStats.upgrades.startBombs * 120;
                const canBuy = currentStats.gold >= cost;
                return (
                  <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Bomba Inicial</span>
                      <span className="text-[11px] text-emerald-400 font-mono">
                        +{currentStats.upgrades.startBombs} bomba(s)
                      </span>
                    </div>
                    <button
                      onClick={() => handleUpgrade('startBombs', cost)}
                      disabled={!canBuy}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono transition cursor-pointer ${
                        canBuy
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {cost} 🪙
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.click();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
