/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { TopNav } from './components/TopNav';
import { HeroSection } from './components/HeroSection';
import { ModuleBlueprintStage } from './components/ModuleBlueprintStage';
import { ModuleEncapsulationStage } from './components/ModuleEncapsulationStage';
import { ModuleInheritanceStage } from './components/ModuleInheritanceStage';
import { ModuleSandboxQuiz } from './components/ModuleSandboxQuiz';

const STORAGE_KEY = 'pylab_oop_progress_v1';

interface SavedProgress {
  completedModules: string[];
  solvedChallenges: string[];
  quizScore: number | null;
}

export default function App() {
  const [progress, setProgress] = useState<SavedProgress>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as SavedProgress;
      }
    } catch {
      // Ignore storage errors
    }
    return {
      completedModules: [],
      solvedChallenges: [],
      quizScore: null,
    };
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Ignore storage errors
    }
  }, [progress]);

  const markModuleCompleted = (moduleKey: string) => {
    setProgress((prev) => {
      if (prev.completedModules.includes(moduleKey)) return prev;
      return {
        ...prev,
        completedModules: [...prev.completedModules, moduleKey],
      };
    });
  };

  const handleSolveChallenge = (challengeId: string) => {
    setProgress((prev) => {
      const solved = prev.solvedChallenges.includes(challengeId)
        ? prev.solvedChallenges
        : [...prev.solvedChallenges, challengeId];
      const completed = prev.completedModules.includes('sandbox')
        ? prev.completedModules
        : [...prev.completedModules, 'sandbox'];
      return {
        ...prev,
        solvedChallenges: solved,
        completedModules: completed,
      };
    });
  };

  const handleQuizComplete = (score: number) => {
    setProgress((prev) => {
      const completed = prev.completedModules.includes('sandbox')
        ? prev.completedModules
        : [...prev.completedModules, 'sandbox'];
      return {
        ...prev,
        quizScore: score,
        completedModules: completed,
      };
    });
  };

  const jumpToModule = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopNav onJumpToModule={jumpToModule} />

      <main>
        <HeroSection
          completedModules={progress.completedModules}
          solvedChallenges={progress.solvedChallenges}
          quizScore={progress.quizScore}
          onJumpToModule={jumpToModule}
        />

        <ModuleBlueprintStage onInteract={() => markModuleCompleted('blueprint')} />

        <ModuleEncapsulationStage onInteract={() => markModuleCompleted('encapsulation')} />

        <ModuleInheritanceStage onInteract={() => markModuleCompleted('inheritance')} />

        <ModuleSandboxQuiz
          solvedChallenges={progress.solvedChallenges}
          onSolveChallenge={handleSolveChallenge}
          onQuizComplete={handleQuizComplete}
          onInteract={() => markModuleCompleted('sandbox')}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div>
            <span className="font-display font-semibold text-slate-900">PyLab OOP</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Python 類別與物件導向互動學習平台</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#module-blueprint" className="hover:text-slate-900 transition-colors">
              藍圖與實例
            </a>
            <a href="#module-encapsulation" className="hover:text-slate-900 transition-colors">
              屬性與封裝
            </a>
            <a href="#module-inheritance" className="hover:text-slate-900 transition-colors">
              繼承與多型
            </a>
            <a href="#module-sandbox" className="hover:text-slate-900 transition-colors">
              實戰與測驗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
