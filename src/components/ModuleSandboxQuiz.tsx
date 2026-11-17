import React, { useState } from 'react';
import { CheckCircle2, Eye, HelpCircle, Play, RotateCcw, Terminal, XCircle } from 'lucide-react';
import { CODING_CHALLENGES, QUIZ_QUESTIONS } from '../data/oopCurriculum';
import { runPythonOOP } from '../utils/pythonMiniRunner';

interface ModuleSandboxQuizProps {
  solvedChallenges: string[];
  onSolveChallenge: (id: string) => void;
  onQuizComplete: (score: number) => void;
  onInteract: () => void;
}

const PLAYGROUND_DEFAULT_CODE = `class Playlist:
    def __init__(self, title):
        self.title = title
        self.tracks = []

    def add(self, song):
        self.tracks.append(song)

    def summary(self):
        return f"歌單《{self.title}》共收錄 {len(self.tracks)} 首歌曲"

my_list = Playlist("Coding Focus")
my_list.add("Midnight Rain")
my_list.add("Solar Drift")
print(my_list.summary())
print(my_list.tracks)
`;

export const ModuleSandboxQuiz: React.FC<ModuleSandboxQuizProps> = ({
  solvedChallenges,
  onSolveChallenge,
  onQuizComplete,
  onInteract,
}) => {
  const [mode, setMode] = useState<'challenges' | 'quiz' | 'playground'>('challenges');

  // Challenge State
  const [challengeIdx, setChallengeIdx] = useState(0);
  const currentChallenge = CODING_CHALLENGES[challengeIdx];
  const [codeByChallenge, setCodeByChallenge] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    CODING_CHALLENGES.forEach((c) => {
      map[c.id] = c.starterCode;
    });
    return map;
  });
  const [showHint, setShowHint] = useState(false);
  const [challengeOutput, setChallengeOutput] = useState<{
    ran: boolean;
    passed: boolean;
    lines: string[];
    error?: string;
  }>({ ran: false, passed: false, lines: [] });

  // Playground State
  const [playgroundCode, setPlaygroundCode] = useState(PLAYGROUND_DEFAULT_CODE);
  const [playgroundResult, setPlaygroundResult] = useState<{
    lines: string[];
    error?: string;
  }>({ lines: [] });

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const currentCode = codeByChallenge[currentChallenge.id] ?? currentChallenge.starterCode;

  const handleRunChallenge = () => {
    onInteract();
    const combined = `${currentCode}\n\n${currentChallenge.testScript}`;
    const res = runPythonOOP(combined);
    if (!res.success) {
      setChallengeOutput({
        ran: true,
        passed: false,
        lines: res.output,
        error: res.error,
      });
      return;
    }

    const expected = currentChallenge.expectedOutput;
    const matched =
      res.output.length === expected.length &&
      expected.every((exp, idx) => res.output[idx] === exp);

    setChallengeOutput({
      ran: true,
      passed: matched,
      lines: res.output,
    });

    if (matched) {
      onSolveChallenge(currentChallenge.id);
    }
  };

  const handleSelectChallenge = (idx: number) => {
    setChallengeIdx(idx);
    setShowHint(false);
    setChallengeOutput({ ran: false, passed: false, lines: [] });
  };

  const handleRunPlayground = () => {
    onInteract();
    const res = runPythonOOP(playgroundCode);
    setPlaygroundResult({
      lines: res.output,
      error: res.error,
    });
  };

  const handleSelectQuizOption = (qId: string, optionIdx: number) => {
    onInteract();
    const next = { ...quizAnswers, [qId]: optionIdx };
    setQuizAnswers(next);
    if (Object.keys(next).length === QUIZ_QUESTIONS.length) {
      const score = QUIZ_QUESTIONS.reduce(
        (acc, q) => (next[q.id] === q.correctIndex ? acc + 1 : acc),
        0
      );
      onQuizComplete(score);
    }
  };

  const quizAnsweredCount = Object.keys(quizAnswers).length;
  const quizCorrectCount = QUIZ_QUESTIONS.reduce(
    (acc, q) => (quizAnswers[q.id] === q.correctIndex ? acc + 1 : acc),
    0
  );

  return (
    <section id="module-sandbox" className="mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-sky-700">04. 程式實戰沙盒與觀念診斷</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            親手編寫 Python 類別並驗證你的理解
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            在瀏覽器內建的 Python OOP 沙盒完成 4 道實戰任務，或透過 6 題核心觀念測驗檢視學習盲點。
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 self-start">
          <button
            type="button"
            onClick={() => setMode('challenges')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'challenges' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            實戰挑戰 ({solvedChallenges.length}/{CODING_CHALLENGES.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('quiz')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'quiz' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            觀念測驗 ({quizAnsweredCount}/{QUIZ_QUESTIONS.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('playground')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'playground' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            自由練習場
          </button>
        </div>
      </div>

      {mode === 'challenges' && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Challenge Selector & Prompt (5/12) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {CODING_CHALLENGES.map((ch, idx) => {
                const isCurrent = idx === challengeIdx;
                const isSolved = solvedChallenges.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleSelectChallenge(idx)}
                    className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                      isCurrent
                        ? 'border-sky-600 bg-sky-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-sky-700 tabular-nums">{ch.number}.</span>
                      {isSolved ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          通過
                        </span>
                      ) : (
                        <span className="text-slate-400">{ch.difficulty}</span>
                      )}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-900 truncate">{ch.title}</div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="text-xs text-slate-500">
                <span>任務 {currentChallenge.number}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{currentChallenge.concept}</span>
              </div>
              <h3 className="mt-1.5 font-display text-lg font-semibold text-slate-900">
                {currentChallenge.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-700">
                {currentChallenge.prompt}
              </p>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-700">自動化驗證測試腳本</div>
                <pre className="mt-1.5 overflow-x-auto font-mono text-xs leading-5 text-slate-700">
                  {currentChallenge.testScript}
                </pre>
                <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-600">
                  預期輸出：<code className="font-mono text-slate-900">{currentChallenge.expectedOutput.join(' | ')}</code>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHint((h) => !h)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  {showHint ? '隱藏提示' : '查看解題提示'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCodeByChallenge((prev) => ({
                      ...prev,
                      [currentChallenge.id]: currentChallenge.solutionCode,
                    }));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  填入參考解答
                </button>
              </div>

              {showHint && (
                <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50/70 p-3 text-xs leading-relaxed text-sky-900">
                  {currentChallenge.hint}
                </div>
              )}
            </div>
          </div>

          {/* Code Editor & Test Runner (7/12) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 text-xs text-slate-300">
                <span className="font-mono">solution_{currentChallenge.number}.py</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCodeByChallenge((prev) => ({
                        ...prev,
                        [currentChallenge.id]: currentChallenge.starterCode,
                      }));
                      setChallengeOutput({ ran: false, passed: false, lines: [] });
                    }}
                    className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    重設程式碼
                  </button>
                  <button
                    type="button"
                    onClick={handleRunChallenge}
                    className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 font-semibold text-white hover:bg-sky-500 cursor-pointer whitespace-nowrap"
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    執行並驗證
                  </button>
                </div>
              </div>

              <textarea
                aria-label="Python 程式碼編輯區"
                spellCheck={false}
                value={currentCode}
                onChange={(e) =>
                  setCodeByChallenge((prev) => ({
                    ...prev,
                    [currentChallenge.id]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const start = el.selectionStart;
                    const end = el.selectionEnd;
                    const nextVal = currentCode.slice(0, start) + '    ' + currentCode.slice(end);
                    setCodeByChallenge((prev) => ({
                      ...prev,
                      [currentChallenge.id]: nextVal,
                    }));
                    window.requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = start + 4;
                    });
                  }
                }}
                rows={13}
                className="w-full resize-y bg-slate-900 p-4 font-mono text-xs leading-6 text-slate-100 focus:outline-none"
              />
            </div>

            {/* Output Terminal */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="inline-flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  執行輸出與測試結果
                </span>
                {challengeOutput.ran && (
                  <span
                    className={`inline-flex items-center gap-1 font-medium ${
                      challengeOutput.passed ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {challengeOutput.passed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        全數測試通過
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        輸出尚未符合預期
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="mt-3 rounded-lg bg-slate-950 p-3.5 font-mono text-xs leading-6 text-slate-200 min-h-[96px]">
                {!challengeOutput.ran ? (
                  <span className="text-slate-500">按下「執行並驗證」查看程式輸出與測試比對結果。</span>
                ) : challengeOutput.error ? (
                  <div className="text-rose-300">{challengeOutput.error}</div>
                ) : (
                  <>
                    {challengeOutput.lines.length === 0 ? (
                      <div className="text-slate-400">(無 print 輸出)</div>
                    ) : (
                      challengeOutput.lines.map((line, i) => (
                        <div key={i} className={challengeOutput.passed ? 'text-emerald-300' : 'text-amber-200'}>
                          {line}
                        </div>
                      ))
                    )}
                    {!challengeOutput.passed && (
                      <div className="mt-2 border-t border-slate-800 pt-2 text-slate-400">
                        預期輸出：{currentChallenge.expectedOutput.join(' | ')}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'quiz' && (
        <div className="mt-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-sm text-slate-700">
              已完成作答 <span className="font-mono font-semibold text-slate-900 tabular-nums">{quizAnsweredCount} / {QUIZ_QUESTIONS.length}</span> 題
              <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
              目前答對 <span className="font-mono font-semibold text-sky-700 tabular-nums">{quizCorrectCount}</span> 題
            </div>
            {quizAnsweredCount > 0 && (
              <button
                type="button"
                onClick={() => setQuizAnswers({})}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                重新測驗
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {QUIZ_QUESTIONS.map((q, qIndex) => {
              const chosen = quizAnswers[q.id];
              const answered = chosen !== undefined;
              const isCorrect = chosen === q.correctIndex;

              return (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>第 {qIndex + 1} 題 · {q.topic}</span>
                      {answered && (
                        <span className={`inline-flex items-center gap-1 font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              答對
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                              需複習
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 font-display text-base font-semibold text-slate-900 leading-snug">
                      {q.question}
                    </h3>

                    {q.codeSnippet && (
                      <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-5 text-slate-200">
                        {q.codeSnippet}
                      </pre>
                    )}

                    <div className="mt-4 space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isPicked = chosen === optIdx;
                        const isRightOpt = optIdx === q.correctIndex;
                        let style = 'border-slate-200 bg-slate-50/70 text-slate-800 hover:border-slate-300';
                        if (answered) {
                          if (isRightOpt) style = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium';
                          else if (isPicked) style = 'border-rose-400 bg-rose-50 text-rose-900';
                          else style = 'border-slate-200 bg-white text-slate-500 opacity-75';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectQuizOption(q.id, optIdx)}
                            className={`w-full rounded-lg border px-3.5 py-2.5 text-left text-xs leading-relaxed transition-colors cursor-pointer ${style}`}
                          >
                            <span className="font-mono font-semibold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {answered && (
                    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                      <span className="font-semibold text-slate-900">觀念解析：</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === 'playground' && (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 text-xs text-slate-300">
              <span className="font-mono">oop_playground.py</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPlaygroundCode(PLAYGROUND_DEFAULT_CODE);
                    setPlaygroundResult({ lines: [] });
                  }}
                  className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  恢復範例
                </button>
                <button
                  type="button"
                  onClick={handleRunPlayground}
                  className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 font-semibold text-white hover:bg-sky-500 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  執行程式
                </button>
              </div>
            </div>
            <textarea
              aria-label="自由練習 Python OOP 程式碼編輯區"
              spellCheck={false}
              value={playgroundCode}
              onChange={(e) => setPlaygroundCode(e.target.value)}
              rows={16}
              className="w-full resize-y bg-slate-900 p-4 font-mono text-xs leading-6 text-slate-100 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 flex flex-col">
            <h3 className="font-display text-base font-semibold text-slate-900">終端機輸出</h3>
            <p className="mt-1 text-xs text-slate-500">
              支援 class、繼承、super()、__init__、@property、try/except 與 print()。
            </p>
            <div className="mt-4 flex-1 rounded-lg bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-200 min-h-[220px]">
              {playgroundResult.error ? (
                <div className="text-rose-300">{playgroundResult.error}</div>
              ) : playgroundResult.lines.length === 0 ? (
                <span className="text-slate-500">點擊「執行程式」查看輸出結果...</span>
              ) : (
                playgroundResult.lines.map((line, i) => (
                  <div key={i} className="text-emerald-300">
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
