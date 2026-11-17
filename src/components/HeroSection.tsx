import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Layers } from 'lucide-react';

interface HeroSectionProps {
  completedModules: string[];
  solvedChallenges: string[];
  quizScore: number | null;
  onJumpToModule: (id: string) => void;
}

const ROADMAP_ITEMS = [
  {
    id: 'module-blueprint',
    key: 'blueprint',
    index: '01',
    title: '類別藍圖與物件實例',
    detail: 'class、__init__ 與記憶體實例化',
  },
  {
    id: 'module-encapsulation',
    key: 'encapsulation',
    index: '02',
    title: '屬性查找與封裝機制',
    detail: 'self、__dict__ 與 @property 驗證',
  },
  {
    id: 'module-inheritance',
    key: 'inheritance',
    index: '03',
    title: '繼承、super() 與多型',
    detail: 'MRO 查找路徑與方法覆寫',
  },
  {
    id: 'module-sandbox',
    key: 'sandbox',
    index: '04',
    title: '程式沙盒與觀念診斷',
    detail: '4 道實戰任務與 6 題核心測驗',
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({
  completedModules,
  solvedChallenges,
  quizScore,
  onJumpToModule,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <section id="top" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch">
          <div className="flex flex-col justify-between lg:col-span-6">
            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500">
                Python 物件導向互動學習實驗室 · 從記憶體視角理解 Class 與 Object
              </p>

              <h1
                className="mt-4 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl leading-[1.14]"
                style={{ textWrap: 'balance' }}
              >
                把抽象的類別藍圖，變成看得見的記憶體物件
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
                在 Python 中，一切皆為物件。透過即時的實例化模擬器、
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800">__dict__</code>
                屬性查找追蹤、MRO 繼承路線圖與瀏覽器內建的 OOP 程式碼沙盒，親手驗證
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800">self</code>
                與物件狀態如何真正運作。
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onJumpToModule('module-blueprint')}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                >
                  建立第一個物件實例
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onJumpToModule('module-sandbox')}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-sky-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  直接挑戰實戰程式題
                </button>
              </div>
            </div>

            <div className="mt-10 border-t border-slate-200 pt-5 text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
              <span>4 個視覺化模組</span>
              <span aria-hidden="true">·</span>
              <span>已解鎖挑戰 {solvedChallenges.length} / 4</span>
              <span aria-hidden="true">·</span>
              <span>{quizScore !== null ? `診斷測驗 ${quizScore} / 6 題正確` : '觀念測驗 6 題待完成'}</span>
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 min-h-[280px] lg:h-full">
              {!imgError ? (
                <img
                  src="/src/assets/images/hero_oop_blueprint_1794897652196.jpg"
                  alt="Python 類別藍圖與三個獨立物件實例的技術架構示意圖"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 p-8 text-center">
                  <Layers className="h-10 w-10 text-sky-700" aria-hidden="true" />
                  <p className="mt-3 font-display text-base font-semibold text-slate-800">
                    Class Blueprint → Object Instances
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    單一類別定義可重複實例化為多個獨立物件
                  </p>
                </div>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent p-4">
                <p className="text-xs font-medium text-white/95">
                  設計圖（Class）只定義一次，實例化（Instantiation）會在記憶體產生彼此獨立的物件個體
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width 4-column roadmap strip below hero split */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP_ITEMS.map((item) => {
            const isDone = completedModules.includes(item.key);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onJumpToModule(item.id)}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-left hover:border-sky-600/50 hover:bg-white transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-sky-700 tabular-nums">{item.index}.</span>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      已探索
                    </span>
                  ) : (
                    <span className="text-slate-400 group-hover:text-sky-700 transition-colors">前往實驗 →</span>
                  )}
                </div>
                <div className="mt-2.5">
                  <h2 className="font-display text-sm font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.detail}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
