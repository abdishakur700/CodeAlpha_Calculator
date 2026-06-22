/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { Trash2, X } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  history: HistoryItem[];
  onClose: () => void;
  onClear: () => void;
  onSelectEntry: (value: string) => void;
}

export default function HistoryPanel({
  isOpen,
  history,
  onClose,
  onClear,
  onSelectEntry,
}: HistoryPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay for mobile focus */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 h-full w-full max-w-[340px] z-50 flex flex-col border-l border-white/10 bg-neutral-900/85 backdrop-blur-xl shadow-2xl p-6"
          >
            {/* Header section */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold tracking-tight text-white font-sans">
                  Operations Log
                </span>
                <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-mono text-neutral-300">
                  {history.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-all active:scale-95 duration-150"
                aria-label="Close panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content items scroll list */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 py-10 space-y-2">
                  <p className="text-sm">Log is currently empty</p>
                  <p className="text-xs text-neutral-600 max-w-[180px]">
                    Completed mathematical calculations will reside here for immediate reuse.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <motion.div
                    key={item.id}
                    layoutId={`hist-${item.id}`}
                    onClick={() => {
                      onSelectEntry(item.result);
                      onClose();
                    }}
                    className="group relative p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer text-right transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="text-xs text-neutral-400 truncate font-mono tracking-tight mb-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      {item.expression} =
                    </div>
                    <div className="text-lg font-semibold text-white tracking-tight leading-snug font-mono truncate">
                      {item.result}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono mt-1 opacity-50">
                      {item.timestamp}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer action buttons */}
            {history.length > 0 && (
              <div className="pt-4 border-t border-white/10 mt-4">
                <button
                  onClick={onClear}
                  className="w-full py-2.5 px-4 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/30 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-semibold tracking-wide font-sans uppercase flex items-center justify-center gap-2 transition-all active:scale-98 duration-150"
                >
                  <Trash2 size={14} />
                  Clear Operation History
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
