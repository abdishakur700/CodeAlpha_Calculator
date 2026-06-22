/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, History as HistoryIcon, Delete, HelpCircle } from 'lucide-react';
import { evaluateExpression } from '../utils/calculator';
import { playClickSound } from '../utils/audio';
import { LayoutMode, HistoryItem, Settings, ThemePreset } from '../types';
import HistoryPanel from './HistoryPanel';
import SettingsModal from './SettingsModal';

interface CalculatorProps {
  settings: Settings;
  themes: ThemePreset[];
  activeThemePreset: ThemePreset;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onThemeRgbChange: (rgb: {
    base: [number, number, number];
    primary: [number, number, number];
    secondary: [number, number, number];
  }) => void;
}

export default function Calculator({
  settings,
  themes,
  activeThemePreset,
  onUpdateSettings,
  onThemeRgbChange,
}: CalculatorProps) {
  // Calculator logical states
  const [expression, setExpression] = useState('');
  const [displayValue, setDisplayValue] = useState('0');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('basic');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shouldReset, setShouldReset] = useState(false);

  // References for handling fluid typography sizing
  const displayRef = useRef<HTMLDivElement | null>(null);

  // Helper for computing parenthesis imbalance
  const getOpenParensCount = () => {
    const opens = (expression.match(/\(/g) || []).length;
    const closes = (expression.match(/\)/g) || []).length;
    return Math.max(0, opens - closes);
  };

  // Keyboard events list binds
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if a settings window is open
      if (isSettingsOpen || isHistoryOpen) return;

      const key = e.key;

      if (key >= '0' && key <= '9') {
        handleNumPress(key);
      } else if (key === '.') {
        handleDecimalPress();
      } else if (key === '+' || key === '-' || key === '*' || key === '/' || key === '%') {
        let op = key;
        if (op === '*') op = '×';
        if (op === '/') op = '÷';
        if (op === '-') op = '−';
        handleOperatorPress(op);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEvaluate();
      } else if (key === 'Backspace') {
        handleBackspace();
      } else if (key === 'Escape') {
        handleClear();
      } else if (key === '(' || key === ')') {
        handleParenthesisPress(key);
      } else if (key === '^') {
        handleOperatorPress('^');
      } else if (key === 's') {
        handleScientificFunc('sin(');
      } else if (key === 'c') {
        handleScientificFunc('cos(');
      } else if (key === 't') {
        handleScientificFunc('tan(');
      } else if (key === 'l') {
        handleScientificFunc('log(');
      } else if (key === 'n') {
        handleScientificFunc('ln(');
      } else if (key === 'r') {
        handleScientificFunc('sqrt(');
      } else if (key === 'p') {
        handleConstantPress('pi');
      } else if (key === 'e') {
        handleConstantPress('e');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [expression, displayValue, shouldReset, isSettingsOpen, isHistoryOpen, settings.angleMode]);

  // Handle number keystroke input
  const handleNumPress = (num: string) => {
    playClickSound('num', settings.soundEnabled);
    if (shouldReset) {
      setExpression(num);
      setDisplayValue(num);
      setShouldReset(false);
    } else {
      const lastChar = expression.slice(-1);
      const isLastCharOperator = ['+', '−', '×', '÷', '^', '%', '('].includes(lastChar);

      if (isLastCharOperator || expression === '' || expression === '0') {
        const nextExpr = expression === '0' ? num : expression + num;
        setExpression(nextExpr);
        setDisplayValue(num);
      } else {
        if (displayValue === '0') {
          // Replace leading zero of current number token to prevent things like '1+05'
          setExpression(expression.slice(0, -1) + num);
          setDisplayValue(num);
        } else {
          // Prevent appending directly after a resolved constant without an operator
          if (lastChar === 'i' || lastChar === 'e' || lastChar === ')') {
            setExpression(expression + '×' + num);
            setDisplayValue(num);
          } else {
            setExpression(expression + num);
            setDisplayValue(displayValue + num);
          }
        }
      }
    }
  };

  // Handle decimal dot
  const handleDecimalPress = () => {
    playClickSound('num', settings.soundEnabled);
    if (shouldReset) {
      setExpression('0.');
      setDisplayValue('0.');
      setShouldReset(false);
      return;
    }

    // Isolate last number grouping to verify existing decimal dot
    const matches = expression.split(/[\+\−\×\÷\^\(\)\%]/);
    const lastToken = matches[matches.length - 1];

    if (!lastToken.includes('.')) {
      if (!lastToken || lastToken === '') {
        setExpression(expression + '0.');
        setDisplayValue('0.');
      } else {
        setExpression(expression + '.');
        setDisplayValue(displayValue + '.');
      }
    }
  };

  // Handle standard math operators
  const handleOperatorPress = (op: string) => {
    playClickSound('op', settings.soundEnabled);
    setShouldReset(false);

    if (expression === '') {
      if (op === '−') {
        setExpression('−');
        setDisplayValue('−');
      }
      return;
    }

    const lastChar = expression.slice(-1);
    const operators = ['+', '−', '×', '÷', '^', '%'];

    if (operators.includes(lastChar)) {
      // Swap operator
      setExpression(expression.slice(0, -1) + op);
    } else {
      setExpression(expression + op);
    }
    setDisplayValue('0');
  };

  // Handle math function parentheses
  const handleParenthesisPress = (paren: string) => {
    playClickSound('op', settings.soundEnabled);
    setShouldReset(false);

    if (paren === '(') {
      const lastChar = expression.slice(-1);
      // Auto-insert implicit multiplication if preceding char is numeric/constant
      if (lastChar && (/[0-9]/.test(lastChar) || lastChar === 'i' || lastChar === 'e' || lastChar === ')')) {
        setExpression(expression + '×(');
      } else {
        setExpression(expression + '(');
      }
    } else {
      // Paren Close
      const openParens = getOpenParensCount();
      if (openParens > 0) {
        setExpression(expression + ')');
      }
    }
    setDisplayValue('0');
  };

  // Handle trigonometric or scientific functional names
  const handleScientificFunc = (func: string) => {
    playClickSound('op', settings.soundEnabled);
    if (shouldReset) {
      setExpression(func);
      setShouldReset(false);
    } else {
      const lastChar = expression.slice(-1);
      if (lastChar && (/[0-9]/.test(lastChar) || lastChar === 'i' || lastChar === 'e' || lastChar === ')')) {
        setExpression(expression + '×' + func);
      } else {
        setExpression(expression + func);
      }
    }
    setDisplayValue('0');
  };

  // Handle mathematical constants pi or e
  const handleConstantPress = (constName: 'pi' | 'e') => {
    playClickSound('num', settings.soundEnabled);
    if (shouldReset) {
      setExpression(constName);
      setShouldReset(false);
    } else {
      const lastChar = expression.slice(-1);
      if (lastChar && (/[0-9]/.test(lastChar) || lastChar === 'i' || lastChar === 'e' || lastChar === ')')) {
        setExpression(expression + '×' + constName);
      } else {
        setExpression(expression + constName);
      }
    }
    setDisplayValue('0');
  };

  // Handle backspace delete
  const handleBackspace = () => {
    playClickSound('clear', settings.soundEnabled);
    if (expression.length === 0) return;

    // Check for multi-symbol scientific functions like 'sin(', 'cos(', 'tan(', 'log(', 'sqrt(', 'ln('
    let deleteSize = 1;
    const suffixes = ['sin(', 'cos(', 'tan(', 'log(', 'sqrt(', 'ln(', 'pi'];
    
    for (const suffix of suffixes) {
      if (expression.endsWith(suffix)) {
        deleteSize = suffix.length;
        break;
      }
    }

    const nextExpr = expression.slice(0, -deleteSize);
    setExpression(nextExpr);

    // Read last token left
    const matches = nextExpr.split(/[\+\−\×\÷\^\(\)\%]/);
    const lastToken = matches[matches.length - 1] || '0';
    setDisplayValue(lastToken);
  };

  // Reset entire inputs
  const handleClear = () => {
    playClickSound('clear', settings.soundEnabled);
    setExpression('');
    setDisplayValue('0');
    setShouldReset(false);
  };

  // Compute final solution expression
  const handleEvaluate = () => {
    if (!expression) return;

    // Auto-complete missing closing parenthesis for user convenience
    let completeExpression = expression;
    const missingCloses = getOpenParensCount();
    for (let i = 0; i < missingCloses; i++) {
      completeExpression += ')';
    }

    const result = evaluateExpression(completeExpression, settings.angleMode);

    if (result === 'Error' || result === 'Domain Error' || result === 'Undefined') {
      playClickSound('error', settings.soundEnabled);
      setDisplayValue(result);
      setShouldReset(true);
    } else {
      playClickSound('eq', settings.soundEnabled);
      setDisplayValue(result);
      setExpression(result);
      setShouldReset(true);

      // Append log history
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        expression: completeExpression,
        result: result,
        timestamp,
      };
      setHistory((prev) => [newItem, ...prev]);
    }
  };

  // Select historical result log to populate active stream
  const handleSelectHistoryEntry = (value: string) => {
    playClickSound('num', settings.soundEnabled);
    setExpression(value);
    setDisplayValue(value);
    setShouldReset(true);
  };

  // Adapt font sizes dynamically for results length
  const getDisplayFontSize = (text: string) => {
    const len = text.length;
    if (len > 15) return 'text-xl sm:text-2xl';
    if (len > 11) return 'text-2xl sm:text-3xl';
    if (len > 8) return 'text-3xl sm:text-4xl';
    return 'text-4xl sm:text-5xl';
  };

  // Button mapping helpers
  const standardButtons = [
    { label: 'C', type: 'clear', class: 'text-rose-400 hover:bg-rose-500/10 border-rose-500/10' },
    { label: '⌫', type: 'backspace', class: 'text-amber-400 hover:bg-amber-500/10 border-amber-500/10' },
    { label: '%', type: 'op', val: '%', class: 'text-indigo-300 hover:bg-indigo-500/10 border-indigo-500/10 font-mono' },
    { label: '÷', type: 'op', val: '÷', class: 'text-indigo-300 hover:bg-indigo-500/10 border-indigo-500/10' },
    { label: '7', type: 'num', val: '7' },
    { label: '8', type: 'num', val: '8' },
    { label: '9', type: 'num', val: '9' },
    { label: '×', type: 'op', val: '×', class: 'text-indigo-300 hover:bg-indigo-500/10 border-indigo-500/10' },
    { label: '4', type: 'num', val: '4' },
    { label: '5', type: 'num', val: '5' },
    { label: '6', type: 'num', val: '6' },
    { label: '−', type: 'op', val: '−', class: 'text-indigo-300 hover:bg-indigo-500/10 border-indigo-500/10' },
    { label: '1', type: 'num', val: '1' },
    { label: '2', type: 'num', val: '2' },
    { label: '3', type: 'num', val: '3' },
    { label: '+', type: 'op', val: '+', class: 'text-indigo-300 hover:bg-indigo-500/10 border-indigo-500/10' },
    { label: '0', type: 'num', val: '0', isDouble: true },
    { label: '.', type: 'decimal' },
    { label: '=', type: 'eq', class: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 shadow-emerald-950/40 shadow-md' },
  ];

  const scientificExtensions = [
    { label: 'sin', type: 'func', val: 'sin(' },
    { label: 'cos', type: 'func', val: 'cos(' },
    { label: 'tan', type: 'func', val: 'tan(' },
    { label: 'log', type: 'func', val: 'log(' },
    { label: 'ln', type: 'func', val: 'ln(' },
    { label: '√', type: 'func', val: 'sqrt(' },
    { label: '^', type: 'op', val: '^' },
    { label: 'π', type: 'const', val: 'pi' },
    { label: 'e', type: 'const', val: 'e' },
    { label: '(', type: 'paren', val: '(' },
    { label: ')', type: 'paren', val: ')' },
  ];

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 select-none relative max-w-4xl mx-auto z-10">
      
      {/* Top Navbar Section */}
      <header className="w-full max-w-md flex items-center justify-between pb-6 border-b border-white/5 mb-8">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-lg font-mono border"
            style={{
              borderColor: activeThemePreset.accentColor + '40',
              backgroundColor: activeThemePreset.accentColor + '15',
              color: activeThemePreset.accentColor,
              boxShadow: `0 0 12px ${activeThemePreset.accentColor}25`
            }}
          >
            C
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-sans text-white">Calculator</h1>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex gap-2.5">
          <button
            onClick={() => {
              playClickSound('op', settings.soundEnabled);
              setIsSettingsOpen(true);
            }}
            className="p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all active:scale-95 duration-150 relative"
            aria-label="Settings panel"
          >
            <SettingsIcon size={18} />
          </button>
          
          <button
            onClick={() => {
              playClickSound('op', settings.soundEnabled);
              setIsHistoryOpen(true);
            }}
            className="p-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all active:scale-95 duration-150 relative"
            aria-label="History logs list"
          >
            <HistoryIcon size={18} />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Glassmorphic Calculator Core Frame */}
      <motion.main
        layoutId="calculator-frame"
        className="w-full max-w-md bg-neutral-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 relative"
        style={{
          boxShadow: `0 20px 40px -15px rgba(0,0,0,0.6), 0 0 40px ${activeThemePreset.accentColor}06`
        }}
      >
        {/* Basic vs Scientific Modes Slider Panel */}
        <div className="bg-neutral-950/70 p-1 rounded-xl border border-white/5 grid grid-cols-2">
          {(['basic', 'scientific'] as LayoutMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                playClickSound('op', settings.soundEnabled);
                setLayoutMode(mode);
              }}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 capitalize font-sans ${
                layoutMode === mode
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Display Panel Container */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 min-h-[140px] flex flex-col justify-end text-right w-full overflow-hidden">
          {/* Active Settings State Tags (e.g. RAD/DEG, open parent count) */}
          <div className="flex items-center justify-between font-mono text-[10px] text-neutral-500 pb-2 mb-1 border-b border-white/3">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-white/5 text-neutral-400 uppercase font-semibold">
                {settings.angleMode}
              </span>
              {getOpenParensCount() > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 uppercase font-semibold">
                  ( {getOpenParensCount()}
                </span>
              )}
            </div>
            <span className="opacity-60">{layoutMode === 'scientific' ? 'Scientific Mode' : 'General'}</span>
          </div>

          {/* Running Formula Display */}
          <div className="font-mono text-sm tracking-tight text-neutral-400 min-h-[22px] truncate opacity-70 mb-2 font-medium">
            {expression || '\u00A0'}
          </div>

          {/* Result Output Display */}
          <div
            ref={displayRef}
            className={`font-semibold tracking-tight text-white leading-none whitespace-nowrap overflow-x-auto no-scrollbar select-none cursor-default font-mono ${getDisplayFontSize(
              displayValue
            )}`}
          >
            {displayValue}
          </div>
        </div>

        {/* Keypad Buttons Section */}
        <div className="flex flex-col gap-4">
          
          {/* Scientific mode extra extension row slides (Mobile/compact grid style) */}
          {layoutMode === 'scientific' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="grid grid-cols-4 gap-2.5 pb-2 border-b border-white/5 overflow-hidden"
            >
              {scientificExtensions.map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => {
                    if (btn.type === 'func') handleScientificFunc(btn.val!);
                    if (btn.type === 'op') handleOperatorPress(btn.val!);
                    if (btn.type === 'const') handleConstantPress(btn.val as 'pi' | 'e');
                    if (btn.type === 'paren') handleParenthesisPress(btn.val!);
                  }}
                  className="py-2.5 px-2 bg-white/5 border border-white/5 hover:border-white/10 text-xs font-semibold font-mono tracking-wide rounded-xl text-neutral-300 hover:text-white active:scale-95 transition-all duration-150 flex items-center justify-center outline-none"
                >
                  {btn.label}
                </button>
              ))}
            </motion.div>
          )}

          {/* Core Calculator Grid */}
          <div className="grid grid-cols-4 gap-3">
            {standardButtons.map((btn) => {
              // Exclude "=" double span placement structure representation (Eq is placed styled rawly below)
              if (btn.label === '=') return null;

              return (
                <button
                  key={btn.label}
                  onClick={() => {
                    if (btn.type === 'num') handleNumPress(btn.val!);
                    if (btn.type === 'op') handleOperatorPress(btn.val!);
                    if (btn.type === 'decimal') handleDecimalPress();
                    if (btn.type === 'clear') handleClear();
                    if (btn.type === 'backspace') handleBackspace();
                  }}
                  className={`relative flex items-center justify-center font-semibold text-lg font-mono ${
                    btn.isDouble ? 'col-span-2 h-14' : 'h-14'
                  } border rounded-2xl active:scale-95 transition-all duration-150 outline-none ${
                    btn.class ||
                    'text-white bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/8'
                  }`}
                >
                  {btn.label === '⌫' ? <Delete size={20} /> : btn.label}
                </button>
              );
            })}

            {/* Equals button placement utilizing custom grids span matching mockup */}
            <button
              onClick={handleEvaluate}
              className="col-span-1 h-14 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition-all duration-150 shadow-emerald-950/40 shadow-sm flex items-center justify-center font-semibold text-xl rounded-2xl outline-none"
              style={{
                boxShadow: `0 8px 16px -6px rgba(16, 185, 129, 0.2)`
              }}
            >
              =
            </button>
          </div>
        </div>
      </motion.main>

      {/* Slide Drawer History Component */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        history={history}
        onClose={() => setIsHistoryOpen(false)}
        onClear={() => setHistory([])}
        onSelectEntry={handleSelectHistoryEntry}
      />

      {/* Preferences Dialog Component */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        themes={themes}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
}
