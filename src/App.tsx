/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Settings, ThemePreset } from './types';
import BackgroundShader from './components/BackgroundShader';
import Calculator from './components/Calculator';

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'neon-blue',
    name: 'Astral Blue',
    primaryColor: 'text-sky-400',
    secondaryColor: 'bg-sky-500/10',
    accentColor: '#a4c9ff',
    glowColor: 'shadow-sky-500/10',
    textColor: 'text-sky-100',
  },
  {
    id: 'neon-emerald',
    name: 'Cyber Emerald',
    primaryColor: 'text-emerald-400',
    secondaryColor: 'bg-emerald-500/10',
    accentColor: '#66df75',
    glowColor: 'shadow-emerald-500/10',
    textColor: 'text-emerald-100',
  },
  {
    id: 'neon-purple',
    name: 'Cosmic Violet',
    primaryColor: 'text-fuchsia-400',
    secondaryColor: 'bg-fuchsia-500/10',
    accentColor: '#d946ef',
    glowColor: 'shadow-fuchsia-500/10',
    textColor: 'text-fuchsia-100',
  },
  {
    id: 'neon-sunset',
    name: 'Sunset Glow',
    primaryColor: 'text-orange-400',
    secondaryColor: 'bg-gradient-to-r from-orange-500/10 to-pink-500/10',
    accentColor: '#f97316',
    glowColor: 'shadow-orange-500/10',
    textColor: 'text-orange-100',
  },
];

const THEME_RGB_MAP: Record<string, {
  base: [number, number, number];
  primary: [number, number, number];
  secondary: [number, number, number];
}> = {
  'neon-blue': {
    base: [0.075, 0.075, 0.075],
    primary: [0.643, 0.788, 1.0],
    secondary: [0.145, 0.388, 0.922],
  },
  'neon-emerald': {
    base: [0.065, 0.075, 0.065],
    primary: [0.4, 0.875, 0.459],
    secondary: [0.0, 0.529, 0.118],
  },
  'neon-purple': {
    base: [0.075, 0.07, 0.082],
    primary: [0.851, 0.275, 0.937],
    secondary: [0.388, 0.4, 0.945],
  },
  'neon-sunset': {
    base: [0.082, 0.07, 0.07],
    primary: [0.976, 0.451, 0.086],
    secondary: [0.925, 0.282, 0.6],
  },
};

export default function App() {
  const [settings, setSettings] = useState<Settings>({
    soundEnabled: true,
    angleMode: 'deg',
    activeTheme: 'neon-blue',
  });

  const handleUpdateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const activePreset = THEME_PRESETS.find((t) => t.id === settings.activeTheme) || THEME_PRESETS[0];
  const shaderRgb = THEME_RGB_MAP[settings.activeTheme] || THEME_RGB_MAP['neon-blue'];

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-neutral-950 text-white font-sans selection:bg-indigo-500/30">
      
      {/* High performance dynamic ambient shader layer */}
      <BackgroundShader themeRgb={shaderRgb} />

      {/* Main Interactive Screen layout */}
      <div className="flex-1 w-full flex items-center justify-center p-4">
        <Calculator
          settings={settings}
          themes={THEME_PRESETS}
          activeThemePreset={activePreset}
          onUpdateSettings={handleUpdateSettings}
          onThemeRgbChange={() => {}}
        />
      </div>
    </div>
  );
}
