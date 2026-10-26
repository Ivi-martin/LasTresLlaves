import React, { useState, useEffect, useRef } from 'react';
import {
  EquippedCosmetics,
  PlayerStats,
  AvatarSkin,
  AvatarHat,
  AvatarAura,
  AvatarWeaponSkin,
} from '../types/game';
import {
  StorageManager,
  DEFAULT_SKINS,
  DEFAULT_HATS,
  DEFAULT_AURAS,
  DEFAULT_WEAPON_SKINS,
} from '../utils/storage';
import { sound } from '../utils/audio';

interface AvatarCustomizerModalProps {
  equipped: EquippedCosmetics;
  stats: PlayerStats;
  onEquippedChange: (newEquipped: EquippedCosmetics) => void;
  onStatsChange: (newStats: PlayerStats) => void;
  onClose: () => void;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  equipped,
  stats,
  onEquippedChange,
  onStatsChange,
  onClose,
}) => {
  const [tab, setTab] = useState<'skins' | 'hats' | 'auras' | 'weapons'>('skins');
  const [unlockedSet, setUnlockedSet] = useState<Set<string>>(StorageManager.getUnlockedItems());
  const [currentEquipped, setCurrentEquipped] = useState<EquippedCosmetics>(equipped);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live Canvas Preview of Avatar
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.05;
      ctx.clearRect(0, 0, 240, 240);

      // Pedestal
      ctx.fillStyle = 'rgba(255, 210, 63, 0.15)';
      ctx.beginPath();
      ctx.ellipse(120, 195, 60, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd23f';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(120, 195, 30, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura particles
      if (currentEquipped.auraId !== 'none') {
        const aura = DEFAULT_AURAS.find((a) => a.id === currentEquipped.auraId);
        if (aura) {
          ctx.fillStyle = aura.color;
          for (let i = 0; i < 5; i++) {
            const angle = t * 2 + i * 1.25;
            const dist = 35 + Math.sin(t * 3 + i) * 10;
            const px = 120 + Math.cos(angle) * dist;
            const py = 140 + Math.sin(angle) * 18 + Math.sin(t * 4 + i) * 6;
            ctx.beginPath();
            ctx.arc(px, py, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Base Sprite with bobbing
      const bob = Math.sin(t * 2) * 3;
      const spriteY = 190 + bob;

      // Draw stylized player character (Martín)
      ctx.save();
      ctx.translate(120, spriteY);

      // Boots with laces and lug sole
      ctx.fillStyle = '#1a1b1d';
      ctx.fillRect(-15, -16, 12, 18);
      ctx.fillRect(3, -16, 12, 18);
      ctx.fillStyle = '#323438'; // Boot laces
      ctx.fillRect(-13, -12, 8, 2);
      ctx.fillRect(-13, -8, 8, 2);
      ctx.fillRect(5, -12, 8, 2);
      ctx.fillRect(5, -8, 8, 2);
      ctx.fillStyle = '#0e0f11'; // Lug sole
      ctx.fillRect(-16, -2, 14, 4);
      ctx.fillRect(2, -2, 14, 4);

      // Pants (Spanish digital camo olive)
      ctx.fillStyle = '#576646';
      ctx.fillRect(-15, -34, 12, 20);
      ctx.fillRect(3, -34, 12, 20);
      // Cargo pockets on pants with flaps
      ctx.fillStyle = '#495734';
      ctx.fillRect(-17, -30, 4, 12);
      ctx.fillRect(13, -30, 4, 12);
      ctx.fillStyle = '#3b472e';
      ctx.fillRect(-17, -30, 4, 3);
      ctx.fillRect(13, -30, 4, 3);

      // Torso / Spanish Camo Jacket
      const skin = DEFAULT_SKINS.find((s) => s.id === currentEquipped.skinId) || DEFAULT_SKINS[0];
      ctx.fillStyle = skin.primaryColor || '#576646';
      ctx.fillRect(-16, -64, 32, 34);

      // 4 Military flap cargo pockets with buttons
      ctx.fillStyle = skin.secondaryColor || '#495734';
      ctx.fillRect(-13, -60, 10, 9);
      ctx.fillRect(3, -60, 10, 9);
      ctx.fillRect(-13, -47, 10, 9);
      ctx.fillRect(3, -47, 10, 9);
      // Pocket flaps & buttons
      ctx.fillStyle = '#3b472e';
      ctx.fillRect(-13, -61, 10, 3);
      ctx.fillRect(3, -61, 10, 3);
      ctx.fillRect(-13, -48, 10, 3);
      ctx.fillRect(3, -48, 10, 3);
      ctx.fillStyle = '#242b1a';
      ctx.fillRect(-9, -59, 2, 2);
      ctx.fillRect(7, -59, 2, 2);
      ctx.fillRect(-9, -46, 2, 2);
      ctx.fillRect(7, -46, 2, 2);

      // Inner crewneck olive undershirt & folded lapels
      ctx.fillStyle = '#343f25';
      ctx.fillRect(-5, -64, 10, 6);
      ctx.fillStyle = '#495734';
      ctx.fillRect(-8, -64, 4, 7);
      ctx.fillRect(4, -64, 4, 7);

      // Head & Peach Skin
      ctx.fillStyle = '#f5cbb0';
      ctx.fillRect(-16, -92, 32, 28);

      // Anime Eyes with specular gleam
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-11, -84, 8, 8);
      ctx.fillRect(3, -84, 8, 8);

      ctx.fillStyle = '#27170e';
      ctx.fillRect(-10, -84, 6, 7);
      ctx.fillRect(4, -84, 6, 7);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10, -84, 2.5, 2.5);
      ctx.fillRect(4, -84, 2.5, 2.5);

      // Smile & Nose
      ctx.fillStyle = '#e4b699';
      ctx.fillRect(-1, -77, 2, 2);
      ctx.fillStyle = '#7a3e32';
      ctx.fillRect(-3, -73, 7, 2);
      ctx.fillRect(3, -74, 2, 2);

      // Eyebrows
      ctx.fillStyle = '#2a1a11';
      ctx.fillRect(-11, -87, 8, 2);
      ctx.fillRect(3, -87, 8, 2);

      // Spiky Voxel Hair (Martín)
      const hat = DEFAULT_HATS.find((h) => h.id === currentEquipped.hatId);
      if (!hat || hat.drawType === 'none') {
        ctx.fillStyle = '#382318';
        ctx.fillRect(-18, -102, 36, 14);
        ctx.fillRect(-8, -108, 18, 8);
        ctx.fillStyle = '#4c3322';
        ctx.fillRect(-15, -94, 9, 11); // Center-left bang
        ctx.fillRect(5, -93, 10, 9);  // Right bang
        ctx.fillRect(-3, -106, 9, 6);
      } else {
        const headY = -82;
        if (hat.drawType === 'crown') {
          ctx.fillStyle = '#ffd23f';
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-12, headY + 4);
          ctx.lineTo(-14, headY - 8);
          ctx.lineTo(-7, headY - 3);
          ctx.lineTo(0, headY - 12);
          ctx.lineTo(7, headY - 3);
          ctx.lineTo(14, headY - 8);
          ctx.lineTo(12, headY + 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Jewels
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-2, headY - 6, 4, 4);
        } else if (hat.drawType === 'fedora') {
          ctx.fillStyle = hat.color;
          ctx.fillRect(-18, headY + 2, 36, 5);
          ctx.fillRect(-12, headY - 8, 24, 10);
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(-12, headY, 24, 2);
        } else if (hat.drawType === 'horns') {
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-10, headY + 2, 20, 6);
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(-10, headY + 2);
          ctx.quadraticCurveTo(-22, headY - 6, -18, headY - 16);
          ctx.lineTo(-7, headY - 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(10, headY + 2);
          ctx.quadraticCurveTo(22, headY - 6, 18, headY - 16);
          ctx.lineTo(7, headY - 2);
          ctx.fill();
        } else if (hat.drawType === 'bandana') {
          ctx.fillStyle = hat.color;
          ctx.fillRect(-11, headY + 6, 22, 6);
          ctx.fillRect(8, headY + 9, 10, 3);
          ctx.fillRect(11, headY + 12, 8, 3);
        } else if (hat.drawType === 'visor') {
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(-12, headY + 10, 24, 5);
        } else if (hat.drawType === 'halo') {
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(0, headY - 10, 14, 5, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Weapon in hands
      const weaponSkin = DEFAULT_WEAPON_SKINS.find((w) => w.id === currentEquipped.weaponSkinId);
      const wColor = weaponSkin ? weaponSkin.color : '#2b2b30';
      ctx.fillStyle = wColor;
      ctx.fillRect(12, -45, 18, 6);
      ctx.fillStyle = weaponSkin ? weaponSkin.bulletColor : '#ffd23f';
      ctx.fillRect(28, -45, 3, 6);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentEquipped]);

  const handleEquip = (type: 'skin' | 'hat' | 'aura' | 'weapon', id: string) => {
    sound.click();
    const updated = { ...currentEquipped };
    if (type === 'skin') updated.skinId = id;
    if (type === 'hat') updated.hatId = id;
    if (type === 'aura') updated.auraId = id;
    if (type === 'weapon') updated.weaponSkinId = id;

    setCurrentEquipped(updated);
    StorageManager.saveEquipped(updated);
    onEquippedChange(updated);
  };

  const handleBuy = (item: AvatarSkin | AvatarHat | AvatarAura | AvatarWeaponSkin) => {
    if (!item.cost || stats.gold < item.cost) return;

    sound.purchase();
    const newGold = stats.gold - item.cost;
    const updatedStats = { ...stats, gold: newGold };
    StorageManager.saveStats(updatedStats);
    StorageManager.unlockItem(item.id);

    setUnlockedSet(StorageManager.getUnlockedItems());
    onStatsChange(updatedStats);

    // Auto-equip purchased
    if ('tintRgba' in item) handleEquip('skin', item.id);
    else if ('drawType' in item) handleEquip('hat', item.id);
    else if ('particleType' in item) handleEquip('aura', item.id);
    else if ('bulletColor' in item) handleEquip('weapon', item.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-gradient-to-b from-[#1b221a] to-[#0e130f] border-2 border-amber-600 rounded-2xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-600/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🪖</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-amber-400 tracking-wide">
                ARMARIO DE AVATARES Y ACCESORIOS
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                Personaliza tu aspecto con atuendos, cascos, auras y armas desbloqueables.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-black/60 border border-amber-500/40 rounded-lg px-3 py-1 text-sm font-mono text-amber-300">
              <span>🪙</span>
              <span className="font-bold">{stats.gold} Oro</span>
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
        </div>

        {/* Content: Left Preview & Right Catalog */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden min-h-0">
          {/* Live Preview Column */}
          <div className="flex flex-col items-center justify-center bg-black/50 border border-amber-600/30 rounded-xl p-4">
            <h3 className="text-xs font-mono font-bold text-amber-400 uppercase mb-2">Vista Previa</h3>
            <canvas
              ref={previewCanvasRef}
              width={240}
              height={240}
              className="w-48 h-48 rounded-xl bg-gradient-to-b from-slate-900/60 to-black/80 border border-slate-800"
            />
            <div className="mt-3 text-center">
              <span className="text-xs font-bold text-slate-300 block">
                {DEFAULT_SKINS.find((s) => s.id === currentEquipped.skinId)?.name}
              </span>
              <span className="text-[11px] text-amber-400 block">
                {DEFAULT_HATS.find((h) => h.id === currentEquipped.hatId)?.name}
              </span>
              <span className="text-[11px] text-purple-400 block">
                {DEFAULT_AURAS.find((a) => a.id === currentEquipped.auraId)?.name}
              </span>
            </div>
          </div>

          {/* Catalog Column */}
          <div className="md:col-span-2 flex flex-col min-h-0">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3 overflow-x-auto">
              <button
                onClick={() => {
                  sound.click();
                  setTab('skins');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tab === 'skins'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                🥋 Trajes
              </button>
              <button
                onClick={() => {
                  sound.click();
                  setTab('hats');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tab === 'hats'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                🎩 Sombreros y Cascos
              </button>
              <button
                onClick={() => {
                  sound.click();
                  setTab('auras');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tab === 'auras'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                ✨ Auras y Estelas
              </button>
              <button
                onClick={() => {
                  sound.click();
                  setTab('weapons');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  tab === 'weapons'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white'
                }`}
              >
                🔫 Aspectos de Arma
              </button>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1 flex-1">
              {tab === 'skins' &&
                DEFAULT_SKINS.map((item) => {
                  const isUnlocked = unlockedSet.has(item.id);
                  const isEquipped = currentEquipped.skinId === item.id;
                  const canBuy = !isUnlocked && item.cost && stats.gold >= item.cost;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                        isEquipped
                          ? 'bg-amber-600/15 border-amber-400 ring-2 ring-amber-400/40'
                          : isUnlocked
                          ? 'bg-slate-900/60 border-slate-700'
                          : 'bg-slate-900/30 border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">{item.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full border border-slate-600 shrink-0"
                          style={{ backgroundColor: item.primaryColor }}
                        />
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-amber-300 font-mono">
                          {isUnlocked ? '✓ Obtenido' : item.unlockRequirement}
                        </span>

                        {isUnlocked ? (
                          <button
                            onClick={() => handleEquip('skin', item.id)}
                            disabled={isEquipped}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              isEquipped
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                          >
                            {isEquipped ? 'Equipado' : 'Equipar'}
                          </button>
                        ) : item.cost ? (
                          <button
                            onClick={() => handleBuy(item)}
                            disabled={!canBuy}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                              canBuy
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            🪙 {item.cost} Oro
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-bold">Bloqueado</span>
                        )}
                      </div>
                    </div>
                  );
                })}

              {tab === 'hats' &&
                DEFAULT_HATS.map((item) => {
                  const isUnlocked = unlockedSet.has(item.id);
                  const isEquipped = currentEquipped.hatId === item.id;
                  const canBuy = !isUnlocked && item.cost && stats.gold >= item.cost;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                        isEquipped
                          ? 'bg-amber-600/15 border-amber-400 ring-2 ring-amber-400/40'
                          : isUnlocked
                          ? 'bg-slate-900/60 border-slate-700'
                          : 'bg-slate-900/30 border-slate-800 opacity-75'
                      }`}
                    >
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{item.name}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-amber-300 font-mono">
                          {isUnlocked ? '✓ Obtenido' : item.unlockRequirement}
                        </span>

                        {isUnlocked ? (
                          <button
                            onClick={() => handleEquip('hat', item.id)}
                            disabled={isEquipped}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              isEquipped
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                          >
                            {isEquipped ? 'Equipado' : 'Equipar'}
                          </button>
                        ) : item.cost ? (
                          <button
                            onClick={() => handleBuy(item)}
                            disabled={!canBuy}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                              canBuy
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            🪙 {item.cost} Oro
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-bold">Bloqueado</span>
                        )}
                      </div>
                    </div>
                  );
                })}

              {tab === 'auras' &&
                DEFAULT_AURAS.map((item) => {
                  const isUnlocked = unlockedSet.has(item.id);
                  const isEquipped = currentEquipped.auraId === item.id;
                  const canBuy = !isUnlocked && item.cost && stats.gold >= item.cost;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                        isEquipped
                          ? 'bg-amber-600/15 border-amber-400 ring-2 ring-amber-400/40'
                          : isUnlocked
                          ? 'bg-slate-900/60 border-slate-700'
                          : 'bg-slate-900/30 border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">{item.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                        {item.color !== '#000000' && (
                          <div
                            className="w-4 h-4 rounded-full shadow-md shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-amber-300 font-mono">
                          {isUnlocked ? '✓ Obtenido' : item.unlockRequirement}
                        </span>

                        {isUnlocked ? (
                          <button
                            onClick={() => handleEquip('aura', item.id)}
                            disabled={isEquipped}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              isEquipped
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                          >
                            {isEquipped ? 'Equipado' : 'Equipar'}
                          </button>
                        ) : item.cost ? (
                          <button
                            onClick={() => handleBuy(item)}
                            disabled={!canBuy}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                              canBuy
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            🪙 {item.cost} Oro
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-bold">Bloqueado</span>
                        )}
                      </div>
                    </div>
                  );
                })}

              {tab === 'weapons' &&
                DEFAULT_WEAPON_SKINS.map((item) => {
                  const isUnlocked = unlockedSet.has(item.id);
                  const isEquipped = currentEquipped.weaponSkinId === item.id;
                  const canBuy = !isUnlocked && item.cost && stats.gold >= item.cost;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                        isEquipped
                          ? 'bg-amber-600/15 border-amber-400 ring-2 ring-amber-400/40'
                          : isUnlocked
                          ? 'bg-slate-900/60 border-slate-700'
                          : 'bg-slate-900/30 border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">{item.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                        <div
                          className="w-4 h-4 rounded-full shadow-md shrink-0"
                          style={{ backgroundColor: item.bulletColor }}
                        />
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-amber-300 font-mono">
                          {isUnlocked ? '✓ Obtenido' : item.unlockRequirement}
                        </span>

                        {isUnlocked ? (
                          <button
                            onClick={() => handleEquip('weapon', item.id)}
                            disabled={isEquipped}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              isEquipped
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                          >
                            {isEquipped ? 'Equipado' : 'Equipar'}
                          </button>
                        ) : item.cost ? (
                          <button
                            onClick={() => handleBuy(item)}
                            disabled={!canBuy}
                            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer ${
                              canBuy
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            🪙 {item.cost} Oro
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-bold">Bloqueado</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
