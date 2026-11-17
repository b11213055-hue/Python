import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Lock, Pause, Play, RotateCcw, ShieldAlert, StepBack, StepForward } from 'lucide-react';
import { ATTRIBUTE_LOOKUP_STEPS } from '../data/oopCurriculum';

interface ModuleEncapsulationStageProps {
  onInteract: () => void;
}

export const ModuleEncapsulationStage: React.FC<ModuleEncapsulationStageProps> = ({ onInteract }) => {
  const [activeTab, setActiveTab] = useState<'lookup' | 'encapsulation'>('lookup');
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Encapsulation interactive state
  const [targetTemp, setTargetTemp] = useState(24);
  const [acceptedTemp, setAcceptedTemp] = useState(24);
  const [accessMode, setAccessMode] = useState<'public' | 'protected' | 'private'>('private');

  const currentStep = ATTRIBUTE_LOOKUP_STEPS[stepIdx];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= ATTRIBUTE_LOOKUP_STEPS.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const handleTempSliderChange = (val: number) => {
    setTargetTemp(val);
    if (val >= 16 && val <= 32) {
      setAcceptedTemp(val);
    }
    onInteract();
  };

  const isTempValid = targetTemp >= 16 && targetTemp <= 32;

  return (
    <section id="module-encapsulation" className="mx-auto max-w-7xl px-6 py-16 border-b border-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-sky-700">02. 屬性查找、__dict__ 與封裝機制</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            屬性如何查找？又該如何保護物件內部狀態？
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            理解 Python 讀取屬性時的查找順序，以及透過單底線、雙底線 Name Mangling 與
            <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">@property</code>
            驗證防止非法賦值。
          </p>
        </div>

        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 self-start">
          <button
            type="button"
            onClick={() => {
              setActiveTab('lookup');
              onInteract();
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'lookup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            屬性查找與 __dict__
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('encapsulation');
              onInteract();
            }}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'encapsulation' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            封裝與 @property 驗證
          </button>
        </div>
      </div>

      {activeTab === 'lookup' ? (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Memory __dict__ Visualizer (7/12) */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900">{currentStep.title}</h3>
                <p className="mt-1 text-xs text-slate-600">{currentStep.explanation}</p>
              </div>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                步驟 {stepIdx + 1} / {ATTRIBUTE_LOOKUP_STEPS.length}
              </span>
            </div>

            {/* Class __dict__ */}
            <div className="mt-5">
              <div
                className={`rounded-lg border p-4 transition-colors ${
                  currentStep.highlightTarget === 'class_dict' || currentStep.highlightTarget === 'lookup_path'
                    ? 'border-amber-500 bg-amber-50/50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-slate-900">Dog.__dict__ (類別命名空間 · 全體共享)</span>
                  <span className="text-slate-500">id: 0x0800</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                  {Object.entries(currentStep.classDict).map(([k, v]) => (
                    <div key={k} className="rounded border border-slate-200 bg-white px-3 py-2">
                      <span className="text-slate-500">{k}: </span>
                      <span className={k === 'tricks' && v.includes('Sit') ? 'font-semibold text-amber-700' : 'text-slate-900'}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instances __dict__ side by side */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div
                  className={`rounded-lg border p-4 transition-colors ${
                    currentStep.highlightTarget === 'instance_a' || currentStep.highlightTarget === 'lookup_path'
                      ? 'border-sky-600 bg-sky-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-900">a.__dict__</span>
                    <span className="font-mono text-slate-500">0x104A</span>
                  </div>
                  <div className="mt-2.5 space-y-1.5 font-mono text-xs tabular-nums">
                    {Object.entries(currentStep.instanceADict).map(([k, v]) => (
                      <div key={k} className="rounded border border-slate-200 bg-white px-3 py-1.5">
                        <span className="text-slate-500">{k}: </span>
                        <span className="font-medium text-sky-800">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-lg border p-4 transition-colors ${
                    currentStep.highlightTarget === 'instance_b'
                      ? 'border-sky-600 bg-sky-50/40'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-900">b.__dict__</span>
                    <span className="font-mono text-slate-500">0x108F</span>
                  </div>
                  <div className="mt-2.5 space-y-1.5 font-mono text-xs tabular-nums">
                    {Object.entries(currentStep.instanceBDict).map(([k, v]) => (
                      <div key={k} className="rounded border border-slate-200 bg-white px-3 py-1.5">
                        <span className="text-slate-500">{k}: </span>
                        <span className="font-medium text-slate-900">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Result Banner (dual coded with icon + label) */}
            <div
              className={`mt-5 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-xs font-medium ${
                stepIdx === 3
                  ? 'border-amber-300 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-slate-50 text-slate-800'
              }`}
            >
              {stepIdx === 3 ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
              )}
              <span className="font-mono">{currentStep.resultText}</span>
            </div>
          </div>

          {/* Right: Playback Controls & Source Code (5/12) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-display text-base font-semibold text-slate-900">
                執行步驟控制器
              </h3>
              <div className="mt-3 rounded-lg bg-slate-900 p-4 font-mono text-xs leading-6 text-sky-200">
                <pre className="overflow-x-auto">{currentStep.code}</pre>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={stepIdx === 0}
                  onClick={() => {
                    setIsPlaying(false);
                    setStepIdx((s) => Math.max(0, s - 1));
                    onInteract();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <StepBack className="h-3.5 w-3.5" aria-hidden="true" />
                  上一步
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (stepIdx >= ATTRIBUTE_LOOKUP_STEPS.length - 1) setStepIdx(0);
                    setIsPlaying((p) => !p);
                    onInteract();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-800 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
                  {isPlaying ? '暫停' : '自動播放'}
                </button>
                <button
                  type="button"
                  disabled={stepIdx >= ATTRIBUTE_LOOKUP_STEPS.length - 1}
                  onClick={() => {
                    setIsPlaying(false);
                    setStepIdx((s) => Math.min(ATTRIBUTE_LOOKUP_STEPS.length - 1, s + 1));
                    onInteract();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <StepForward className="h-3.5 w-3.5" aria-hidden="true" />
                  下一步
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setStepIdx(0);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  重設
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-slate-200">
              <p className="text-xs text-slate-400">Dog 類別定義</p>
              <pre className="mt-2 overflow-x-auto font-mono text-xs leading-6">
{`class Dog:
    species = "Canis"      # 不可變字串 (安全共享)
    tricks = []            # 注意！可變 list 放在類別層級會有共享副作用

    def __init__(self, name):
        self.name = name   # 寫入各自實例的 __dict__`}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Encapsulation Visibility Inspector */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <h3 className="font-display text-base font-semibold text-slate-900">
              Python 存取慣例與名稱修飾 (Name Mangling)
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              切換三種命名慣例，檢視 Python 實際在物件內部儲存的屬性名稱與外部存取結果。
            </p>

            <div className="mt-4 flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {[
                { key: 'public', label: '公開 name' },
                { key: 'protected', label: '受保護 _token' },
                { key: 'private', label: '私有 __pin' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setAccessMode(item.key as 'public' | 'protected' | 'private');
                    onInteract();
                  }}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    accessMode === item.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
              {accessMode === 'public' && (
                <>
                  <div className="font-mono text-sm font-semibold text-slate-900">self.name = "Vault-A"</div>
                  <p className="text-slate-600 leading-relaxed">
                    無底線前綴為公開屬性。類別內外皆可直接讀取與改寫，__dict__ 中鍵名為 <code className="font-mono text-sky-700">"name"</code>。
                  </p>
                  <div className="rounded bg-slate-900 p-3 font-mono text-emerald-300">
                    {`>>> v.name       # 'Vault-A'\n>>> v.__dict__   # {'name': 'Vault-A'}`}
                  </div>
                </>
              )}
              {accessMode === 'protected' && (
                <>
                  <div className="font-mono text-sm font-semibold text-slate-900">self._token = "x92f"</div>
                  <p className="text-slate-600 leading-relaxed">
                    單底線前綴為開發者約定俗成的「內部屬性」，提醒外部呼叫端不要隨意修改；Python 直譯器本身不會阻擋存取。
                  </p>
                  <div className="rounded bg-slate-900 p-3 font-mono text-amber-200">
                    {`>>> v._token     # 可讀取 'x92f'，但代表內部實作細節\n>>> v.__dict__   # {'_token': 'x92f'}`}
                  </div>
                </>
              )}
              {accessMode === 'private' && (
                <>
                  <div className="font-mono text-sm font-semibold text-slate-900">self.__pin = 1234</div>
                  <p className="text-slate-600 leading-relaxed">
                    雙底線前綴會觸發 Name Mangling：Python 自動將鍵名改寫為
                    <code className="mx-1 font-mono text-sky-700">_Vault__pin</code>
                    ，防止子類別意外覆寫或外部直接寫 v.__pin 誤觸。
                  </p>
                  <div className="rounded bg-slate-900 p-3 font-mono text-rose-300">
                    {`>>> v.__pin        # AttributeError: 'Vault' object has no attribute '__pin'\n>>> v._Vault__pin  # 1234 (實際儲存名稱)`}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* @property Live Validation Slider */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                @property 屬性守門員模擬
              </h3>
              <Lock className="h-4 w-4 text-sky-700" aria-hidden="true" />
            </div>
            <p className="mt-1 text-xs text-slate-600">
              拖曳下方滑桿嘗試設定冷氣目標溫度（合法範圍：16°C ～ 32°C），觀察 setter 如何攔截異常值。
            </p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-medium">
                <label htmlFor="ac-temp-slider" className="text-slate-700">
                  設定目標溫度：ac.temp = {targetTemp}
                </label>
                <span className="font-mono text-sky-700 tabular-nums">
                  目前有效儲存值 (_temp): {acceptedTemp}°C
                </span>
              </div>
              <input
                id="ac-temp-slider"
                type="range"
                min={10}
                max={40}
                step={1}
                value={targetTemp}
                onChange={(e) => handleTempSliderChange(Number(e.target.value))}
                className="mt-2.5 w-full accent-sky-700 cursor-pointer"
              />
              <div className="mt-1 flex justify-between font-mono text-[11px] text-slate-400 tabular-nums">
                <span>10°C (過低)</span>
                <span>16°C</span>
                <span>24°C</span>
                <span>32°C</span>
                <span>40°C (過高)</span>
              </div>
            </div>

            <div
              className={`mt-4 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-xs ${
                isTempValid
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              {isTempValid ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
              )}
              <div>
                <div className="font-semibold">
                  {isTempValid ? '驗證通過：已寫入 self._temp' : '驗證攔截：觸發 ValueError'}
                </div>
                <div className="mt-0.5 font-mono">
                  {isTempValid
                    ? `ac.temp = ${targetTemp} -> self._temp 成功更新為 ${targetTemp}`
                    : `ValueError: 溫度 ${targetTemp}°C 超出 16~32°C 安全區間，self._temp 維持 ${acceptedTemp}°C`}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-900 p-3.5 font-mono text-xs leading-6 text-slate-200">
              <pre className="overflow-x-auto">
{`@property
def temp(self):
    return self._temp

@temp.setter
def temp(self, value):
    if not (16 <= value <= 32):
        raise ValueError("溫度超出安全區間")
    self._temp = value`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
