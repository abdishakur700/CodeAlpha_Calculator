/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LayoutMode = 'basic' | 'scientific';

export type AngleMode = 'deg' | 'rad';

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  primaryColor: string; // Tailwind class like text-sky-400
  secondaryColor: string; // Tailwind bg color like bg-sky-500/10
  accentColor: string; // Hex code or RGB for canvas shader and inline glows
  glowColor: string; // Shadow glow class
  textColor: string;
}

export interface Settings {
  soundEnabled: boolean;
  angleMode: AngleMode;
  activeTheme: string;
}
