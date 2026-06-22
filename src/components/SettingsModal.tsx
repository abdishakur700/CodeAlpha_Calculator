/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { Check, Volume2, VolumeX, Compass, Palette, X } from 'lucide-react';
import { ThemePreset, Settings, AngleMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: Settings;
  themes: ThemePreset[];
  onClose: () => void;
  onUpdateSettings: (settings: Partial<Settings>) => void;
}

export default function SettingsModal({
  isOpen,
  settings,
  themes,
  onClose,
  onUpdateSettings,
}: SettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Solid Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            {/* Modal Dialog Body */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-neutral-900/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col p-6 text-white text-left font-sans"
            >
              {/* Header Title Bar */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-5">
                <h3 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                  Preferences
                </h3>
                <button
                  onClick={onClose}
                  className="text-neutral-400 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-transform active:scale-95 duration-150"
                  aria-label="Close preferences"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                {/* 1. Tactile Sound Switcher */}
                <div className="flex items-center justify-between p-1 bg-white/2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                      {settings.soundEnabled ? (
                        <Volume2 size={18} className="text-emerald-400" />
                      ) : (
                        <VolumeX size={18} className="text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Click Sound Synthesis</h4>
                      <p className="text-xs text-neutral-400">Synthesize audio clicks using Tone generators</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.soundEnabled ? 'bg-indigo-500' : 'bg-neutral-800'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Angle Units (Degrees / Radians) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Compass size={16} className="text-indigo-400" />
                    <h4 className="text-sm font-medium">Angle Units</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['deg', 'rad'] as AngleMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => onUpdateSettings({ angleMode: mode })}
                        className={`py-2 px-3 rounded-xl border text-sm font-medium transition-all active:scale-98 capitalize flex items-center justify-between ${
                          settings.angleMode === mode
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                            : 'bg-white/5 border-white/5 text-neutral-400 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        {mode === 'deg' ? 'Degrees (°)' : 'Radians (rad)'}
                        {settings.angleMode === mode && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Luminous Themes Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Palette size={16} className="text-indigo-400" />
                    <h4 className="text-sm font-medium">Accent Palette & Aura</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => onUpdateSettings({ activeTheme: theme.id })}
                        className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] relative overflow-hidden flex flex-col justify-between h-20 ${
                          settings.activeTheme === theme.id
                            ? 'bg-white/10 border-white/25 shadow-lg'
                            : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/7'
                        }`}
                      >
                        {/* Glow preview pill */}
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-semibold">{theme.name}</span>
                          <div
                            className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                        </div>
                        {/* Visual swatch line preview */}
                        <div className="flex gap-1.5 mt-2">
                          <div
                            className="h-1.5 w-6 rounded-full"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                          <div className="h-1.5 w-3 rounded-full bg-white/20" />
                        </div>
                        {settings.activeTheme === theme.id && (
                          <div className="absolute right-2 bottom-2 bg-indigo-500 p-0.5 rounded-full">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preferences Footer close */}
              <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-all active:scale-95"
                >
                  Confirm Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
