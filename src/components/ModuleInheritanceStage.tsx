import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, GitBranch, Play, RotateCcw } from 'lucide-react';

interface ModuleInheritanceStageProps {
  onInteract: () => void;
}

type NodeKey = 'Animal' | 'Dog' | 'Cat' | 'RobotDog';

interface ClassNodeMeta {
  key: NodeKey;
  title: string;
  parent: NodeKey | null;
  mro: string;
  ownMethods: string[];
  inheritedMethods: string[];
  speakResult: string;
  sleepResult: string;
  code: string;
}

const CLASS_NODES: Record<NodeKey, ClassNodeMeta> = {
  Animal: {
    key: 'Animal',
    title: 'Animal (父類別 / Base)',
    parent: null,
    mro: 'Animal -> object',
    ownMethods: ['__init__(self, name)', 'speak(self)', 'sleep(self)'],
    inheritedMethods: [],
    speakResult: '"..." (預設動物叫聲)',
    sleepResult: '"動物正在休息..."',
    code: `class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

    def sleep(self):
        return f"{self.name} 正在休息"`,
  },
  Dog: {
    key: 'Dog',
    title: 'Dog(Animal)',
    parent: 'Animal',
    mro: 'Dog -> Animal -> object',
    ownMethods: ['speak(self)  [覆寫 Override]'],
    inheritedMethods: ['__init__(self, name)', 'sleep(self)'],
    speakResult: '"Rex: Woof!"',
    sleepResult: '"Rex 正在休息" (繼承自 Animal)',
    code: `class Dog(Animal):
    # 未覆寫 __init__ 與 sleep，自動沿用 Animal
    def speak(self):
        return f"{self.name}: Woof!"`,
  },
  Cat: {
    key: 'Cat',
    title: 'Cat(Animal)',
    parent: 'Animal',
    mro: 'Cat -> Animal -> object',
    ownMethods: ['speak(self)  [覆寫 Override]'],
    inheritedMethods: ['__init__(self, name)', 'sleep(self)'],
    speakResult: '"Mimi: Meow!"',
    sleepResult: '"Mimi 正在休息" (繼承自 Animal)',
    code: `class Cat(Animal):
    def speak(self):
        return f"{self.name}: Meow!"`,
  },
  RobotDog: {
    key: 'RobotDog',
    title: 'RobotDog(Animal)',
    parent: 'Animal',
    mro: 'RobotDog -> Animal -> object',
    ownMethods: ['__init__(self, name, battery)', 'speak(self)  [覆寫 Override]'],
    inheritedMethods: ['sleep(self)'],
    speakResult: '"Bolt: Beep-Woof! (電量 90%)"',
    sleepResult: '"Bolt 正在休息" (繼承自 Animal)',
    code: `class RobotDog(Animal):
    def __init__(self, name, battery=90):
        super().__init__(name)   # 委派父類別建立 self.name
        self.battery = battery

    def speak(self):
        return f"{self.name}: Beep-Woof! (電量 {self.battery}%)"`,
  },
};

export const ModuleInheritanceStage: React.FC<ModuleInheritanceStageProps> = ({ onInteract }) => {
  const [selectedNode, setSelectedNode] = useState<NodeKey>('RobotDog');
  const [useSuperInit, setUseSuperInit] = useState<boolean>(true);
  const [methodToCall, setMethodToCall] = useState<'speak' | 'sleep'>('speak');
  const [polyActiveIndex, setPolyActiveIndex] = useState<number | null>(null);
  const [polyLogs, setPolyLogs] = useState<string[]>([]);

  const activeMeta = CLASS_NODES[selectedNode];

  const handleRunPolymorphism = (targetMethod: 'speak' | 'sleep') => {
    setMethodToCall(targetMethod);
    const items: { varName: string; cls: NodeKey }[] = [
      { varName: 'dog', cls: 'Dog' },
      { varName: 'cat', cls: 'Cat' },
      { varName: 'robo', cls: 'RobotDog' },
    ];
    const logs: string[] = [`# 執行多型迴圈：for pet in [dog, cat, robo]: pet.${targetMethod}()`];
    items.forEach((item) => {
      if (item.cls === 'RobotDog' && !useSuperInit) {
        logs.push(
          `[X] robo.${targetMethod}() -> AttributeError: 'RobotDog' object has no attribute 'name' (未呼叫 super().__init__)`
        );
      } else {
        const meta = CLASS_NODES[item.cls];
        const resolvedAt = targetMethod === 'speak' ? `${item.cls}.speak` : `Animal.sleep (繼承)`;
        const outputVal = targetMethod === 'speak' ? meta.speakResult : meta.sleepResult;
        logs.push(`${item.varName}.${targetMethod}() [${resolvedAt}] => ${outputVal}`);
      }
    });
    setPolyActiveIndex(2);
    setPolyLogs(logs);
    onInteract();
  };

  return (
    <section id="module-inheritance" className="mx-auto max-w-7xl px-6 py-16 border-b border-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-sky-700">03. 繼承、super() 與多型演練</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            方法查找順序 (MRO) 與多型的統一介面
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            點選類別樹狀圖中的任一類別檢視 MRO 查找鏈，並測試移除
            <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">super().__init__()</code>
            對子類別實例化的實際影響。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRunPolymorphism('speak')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            模擬多型呼叫 .speak()
          </button>
          <button
            type="button"
            onClick={() => handleRunPolymorphism('sleep')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            模擬繼承呼叫 .sleep()
          </button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Hierarchy Diagram & Polymorphism Output (7/12) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="blueprint-grid rounded-xl border border-slate-200 p-5 sm:p-6">
            <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-200/80 pb-3">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                <GitBranch className="h-4 w-4 text-sky-700" aria-hidden="true" />
                類別繼承樹狀圖 (點選節點檢視 MRO)
              </span>
              <span className="font-mono text-slate-500">MRO: {activeMeta.mro}</span>
            </div>

            {/* Parent Node */}
            <div className="mt-6 flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedNode('Animal');
                  onInteract();
                }}
                className={`w-full max-w-xs rounded-lg border p-3.5 text-left transition-all cursor-pointer ${
                  selectedNode === 'Animal'
                    ? 'border-sky-600 bg-white ring-2 ring-sky-600/15'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-slate-900">class Animal</span>
                  <span className="text-xs text-slate-500">父類別</span>
                </div>
                <div className="mt-1.5 font-mono text-xs text-slate-600">
                  __init__ · speak() · sleep()
                </div>
              </button>

              {/* Connector Lines */}
              <div className="h-6 w-px bg-slate-300" aria-hidden="true" />
              <div className="hidden sm:block h-px w-2/3 bg-slate-300" aria-hidden="true" />

              {/* Subclass Nodes */}
              <div className="mt-3 sm:mt-0 grid w-full grid-cols-1 gap-3 sm:grid-cols-3 pt-0 sm:pt-4">
                {(['Dog', 'Cat', 'RobotDog'] as NodeKey[]).map((key, idx) => {
                  const meta = CLASS_NODES[key];
                  const active = selectedNode === key;
                  const broken = key === 'RobotDog' && !useSuperInit;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedNode(key);
                        onInteract();
                      }}
                      className={`rounded-lg border p-3.5 text-left transition-all cursor-pointer ${
                        broken
                          ? 'border-rose-300 bg-rose-50/70'
                          : active
                            ? 'border-sky-600 bg-white ring-2 ring-sky-600/15'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-semibold text-slate-900">{meta.title}</span>
                      </div>
                      <div className="mt-2 font-mono text-[11px] text-slate-600 space-y-0.5">
                        <div className="text-sky-700 font-medium">覆寫：speak()</div>
                        <div>繼承：sleep()</div>
                        {key === 'RobotDog' && (
                          <div className={useSuperInit ? 'text-emerald-700' : 'text-rose-700 font-semibold'}>
                            {useSuperInit ? '✓ super().__init__' : '✕ 缺少 super()'}
                          </div>
                        )}
                      </div>
                      {polyActiveIndex !== null && idx <= polyActiveIndex && (
                        <div className="mt-2 border-t border-slate-100 pt-1.5 font-mono text-[11px] text-slate-700">
                          .{methodToCall}() 已解析
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Polymorphism Console Output */}
          <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-400">
              <span>多型執行結果與 MRO 解析軌跡</span>
              {polyLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPolyLogs([]);
                    setPolyActiveIndex(null);
                  }}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  清除
                </button>
              )}
            </div>
            <div className="mt-3 space-y-1.5 font-mono text-xs leading-relaxed">
              {polyLogs.length === 0 ? (
                <p className="text-slate-400">
                  點擊上方「模擬多型呼叫 .speak()」或「模擬繼承呼叫 .sleep()」，觀察不同子類別如何共用同一個呼叫介面。
                </p>
              ) : (
                polyLogs.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith('[X]')
                        ? 'text-rose-300'
                        : line.startsWith('#')
                          ? 'text-slate-400'
                          : 'text-emerald-300'
                    }
                  >
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Selected Node Inspector + super() Experiment Toggle (5/12) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                節點檢查：{activeMeta.title}
              </h3>
            </div>
            <p className="mt-1 font-mono text-xs text-sky-700">MRO 順序：{activeMeta.mro}</p>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-700">自身定義 / 覆寫方法</span>
                <ul className="mt-1 space-y-1 font-mono text-slate-800">
                  {activeMeta.ownMethods.map((m) => (
                    <li key={m} className="rounded bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>

              {activeMeta.inheritedMethods.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700">直接沿用自父類別 Animal</span>
                  <ul className="mt-1 space-y-1 font-mono text-slate-600">
                    {activeMeta.inheritedMethods.map((m) => (
                      <li key={m} className="rounded bg-slate-50 px-2.5 py-1.5 border border-slate-100">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg bg-slate-900 p-3.5 font-mono text-xs leading-6 text-slate-200">
              <pre className="overflow-x-auto">
                {selectedNode === 'RobotDog' && !useSuperInit
                  ? `class RobotDog(Animal):
    def __init__(self, name, battery=90):
        # 未呼叫 super().__init__(name) -> 缺少 self.name!
        self.battery = battery

    def speak(self):
        return f"{self.name}: Beep-Woof!"`
                  : activeMeta.code}
              </pre>
            </div>
          </div>

          {/* Interactive super().__init__() Toggle */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  實驗開關：RobotDog 是否呼叫 super().__init__()
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  子類別若覆寫 __init__ 卻忘記呼叫 super()，父類別初始化的屬性將不會存在。
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={useSuperInit}
                onClick={() => {
                  setUseSuperInit((v) => !v);
                  setSelectedNode('RobotDog');
                  onInteract();
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  useSuperInit
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'bg-rose-700 text-white hover:bg-rose-800'
                }`}
              >
                {useSuperInit ? '已啟用 super()' : '已停用 super()'}
              </button>
            </div>

            <div
              className={`mt-3 flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-xs ${
                useSuperInit
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
            >
              {useSuperInit ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
              )}
              <span>
                {useSuperInit
                  ? '正常狀態：RobotDog 透過 super().__init__(name) 建立 self.name，同時保有專屬的 self.battery。'
                  : '錯誤示範：跳過 super().__init__ 導致 self.name 未被建立，呼叫 speak() 或 sleep() 會立即發生 AttributeError。'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
