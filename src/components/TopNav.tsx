import React from 'react';

interface TopNavProps {
  onJumpToModule: (id: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onJumpToModule }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-3.5">
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600"
        >
          PyLab OOP
        </a>

        <nav aria-label="主要章節導覽" className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#module-blueprint"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            藍圖與實例
          </a>
          <a
            href="#module-encapsulation"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            屬性與封裝
          </a>
          <a
            href="#module-inheritance"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            繼承與多型
          </a>
          <a
            href="#module-sandbox"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            實戰與測驗
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onJumpToModule('module-blueprint')}
            className="rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          >
            開始互動實驗
          </button>
        </div>
      </div>
    </header>
  );
};
