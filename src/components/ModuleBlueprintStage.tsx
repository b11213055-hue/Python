import React, { useMemo, useState } from 'react';
import { Play, Plus, RotateCcw, StepForward, Trash2, Zap } from 'lucide-react';
import { BLUEPRINT_TEMPLATES, BlueprintTemplate } from '../data/oopCurriculum';

interface MemoryInstance {
  id: string;
  varName: string;
  address: string;
  attrs: Record<string, string | number>;
  lastAction: string;
}

interface ModuleBlueprintStageProps {
  onInteract: () => void;
}

const INIT_LIFECYCLE = [
  { step: 1, label: '配置記憶體空間', detail: 'Python 的 __new__ 在 Heap 記憶體區配置新物件位址。' },
  { step: 2, label: '傳入 self 參考', detail: '將剛建立的空白物件位址綁定為 __init__(self, ...) 的第一個參數。' },
  { step: 3, label: '寫入實例屬性', detail: '依序執行 self.attr = value，把資料存進這個物件專屬的命名空間。' },
  { step: 4, label: '回傳物件至變數', detail: '將記憶體位址指派給左側變數（例如 r1），完成實例化。' },
];

const ADDRESS_POOL = ['0x104A', '0x108F', '0x10C2', '0x110E'];

export const ModuleBlueprintStage: React.FC<ModuleBlueprintStageProps> = ({ onInteract }) => {
  const [templateId, setTemplateId] = useState<BlueprintTemplate['id']>('robot');
  const template = useMemo(
    () => BLUEPRINT_TEMPLATES.find((t) => t.id === templateId) || BLUEPRINT_TEMPLATES[0],
    [templateId]
  );

  const [formValues, setFormValues] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    BLUEPRINT_TEMPLATES[0].fields.forEach((f) => {
      initial[f.name] = f.defaultValue;
    });
    return initial;
  });

  const [instances, setInstances] = useState<MemoryInstance[]>(() => [
    {
      id: 'inst-1',
      varName: 'r1',
      address: '0x104A',
      attrs: { name: 'Atlas', energy: 80, role: 'Explorer' },
      lastAction: '已透過 __init__ 初始化完成',
    },
    {
      id: 'inst-2',
      varName: 'r2',
      address: '0x108F',
      attrs: { name: 'Nova', energy: 55, role: 'Builder' },
      lastAction: '已透過 __init__ 初始化完成',
    },
  ]);

  const [selectedId, setSelectedId] = useState<string>('inst-1');
  const [lifecycleStep, setLifecycleStep] = useState<number>(4);
  const [executionLog, setExecutionLog] = useState<string[]>([
    '>>> r1 = Robot("Atlas", 80, "Explorer")',
    '>>> r2 = Robot("Nova", 55, "Builder")',
  ]);

  const handleTemplateSwitch = (nextId: BlueprintTemplate['id']) => {
    const nextTpl = BLUEPRINT_TEMPLATES.find((t) => t.id === nextId)!;
    setTemplateId(nextId);
    const defaults: Record<string, string | number> = {};
    nextTpl.fields.forEach((f) => {
      defaults[f.name] = f.defaultValue;
    });
    setFormValues(defaults);

    const varPrefix = nextId === 'robot' ? 'r' : nextId === 'account' ? 'acc' : 'h';
    const secondAttrs: Record<string, string | number> =
      nextId === 'robot'
        ? { name: 'Nova', energy: 55, role: 'Builder' }
        : nextId === 'account'
          ? { owner: 'Leo', balance: 2400, tier: 'Premier' }
          : { name: 'Lyra', hp: 90, job: 'Mage' };

    const firstInst: MemoryInstance = {
      id: 'inst-1',
      varName: `${varPrefix}1`,
      address: '0x104A',
      attrs: { ...defaults },
      lastAction: '已透過 __init__ 初始化完成',
    };
    const secondInst: MemoryInstance = {
      id: 'inst-2',
      varName: `${varPrefix}2`,
      address: '0x108F',
      attrs: secondAttrs,
      lastAction: '已透過 __init__ 初始化完成',
    };

    setInstances([firstInst, secondInst]);
    setSelectedId('inst-1');
    setLifecycleStep(4);
    const argStr1 = Object.values(defaults)
      .map((v) => (typeof v === 'string' ? `"${v}"` : v))
      .join(', ');
    const argStr2 = Object.values(secondAttrs)
      .map((v) => (typeof v === 'string' ? `"${v}"` : v))
      .join(', ');
    setExecutionLog([
      `>>> ${varPrefix}1 = ${nextTpl.className}(${argStr1})`,
      `>>> ${varPrefix}2 = ${nextTpl.className}(${argStr2})`,
    ]);
    onInteract();
  };

  const handleInstantiate = () => {
    if (instances.length >= 4) return;
    const varPrefix = templateId === 'robot' ? 'r' : templateId === 'account' ? 'acc' : 'h';
    const nextIdx = instances.length + 1;
    const usedAddrs = new Set(instances.map((i) => i.address));
    const addr = ADDRESS_POOL.find((a) => !usedAddrs.has(a)) || `0x11${nextIdx}C`;
    const newInst: MemoryInstance = {
      id: `inst-${Date.now()}`,
      varName: `${varPrefix}${nextIdx}`,
      address: addr,
      attrs: { ...formValues },
      lastAction: '剛完成 __init__ 建構',
    };
    const argsText = template.fields
      .map((f) => {
        const val = formValues[f.name];
        return typeof val === 'string' ? `"${val}"` : String(val);
      })
      .join(', ');
    setInstances((prev) => [...prev, newInst]);
    setSelectedId(newInst.id);
    setLifecycleStep(1);
    setExecutionLog((prev) => [
      ...prev.slice(-5),
      `>>> ${newInst.varName} = ${template.className}(${argsText})  # 位址 ${addr}`,
    ]);
    onInteract();
  };

  const handleInvokeMethod = (methodName: string) => {
    const target = instances.find((i) => i.id === selectedId);
    if (!target) return;

    let msg = '';
    const updatedAttrs = { ...target.attrs };

    if (templateId === 'robot') {
      const energy = Number(updatedAttrs.energy);
      if (methodName === 'work') {
        if (energy >= 20) {
          updatedAttrs.energy = energy - 20;
          msg = `${updatedAttrs.name} 完成任務，剩餘電量 ${updatedAttrs.energy}%`;
        } else {
          msg = `${updatedAttrs.name} 電量不足，請先充電`;
        }
      } else if (methodName === 'charge') {
        updatedAttrs.energy = Math.min(100, energy + 30);
        msg = `${updatedAttrs.name} 充電完成，目前電量 ${updatedAttrs.energy}%`;
      }
    } else if (templateId === 'account') {
      const bal = Number(updatedAttrs.balance);
      if (methodName === 'deposit') {
        updatedAttrs.balance = bal + 500;
        msg = `${updatedAttrs.owner} 存入 500，餘額 ${updatedAttrs.balance}`;
      } else if (methodName === 'withdraw') {
        if (bal >= 300) {
          updatedAttrs.balance = bal - 300;
          msg = `${updatedAttrs.owner} 提領 300，餘額 ${updatedAttrs.balance}`;
        } else {
          msg = `${updatedAttrs.owner} 餘額不足`;
        }
      }
    } else if (templateId === 'hero') {
      const hp = Number(updatedAttrs.hp);
      if (methodName === 'take_damage') {
        updatedAttrs.hp = Math.max(0, hp - 25);
        msg = `${updatedAttrs.name} 受到 25 傷害，HP: ${updatedAttrs.hp}`;
      } else if (methodName === 'heal') {
        updatedAttrs.hp = Math.min(200, hp + 20);
        msg = `${updatedAttrs.name} 恢復 20 生命，HP: ${updatedAttrs.hp}`;
      }
    }

    setInstances((prev) =>
      prev.map((inst) =>
        inst.id === target.id ? { ...inst, attrs: updatedAttrs, lastAction: msg } : inst
      )
    );
    const methodMeta = template.methods.find((m) => m.name === methodName);
    const callCode = methodMeta ? methodMeta.codeLine(target.varName) : `${target.varName}.${methodName}()`;
    setExecutionLog((prev) => [...prev.slice(-5), `>>> ${callCode}  # self -> ${target.varName} (${target.address})`, `    => "${msg}"`]);
    onInteract();
  };

  const handleRemoveInstance = (id: string) => {
    if (instances.length <= 1) return;
    const next = instances.filter((i) => i.id !== id);
    setInstances(next);
    if (selectedId === id) setSelectedId(next[0].id);
  };

  const selectedInstance = instances.find((i) => i.id === selectedId) || instances[0];

  return (
    <section id="module-blueprint" className="mx-auto max-w-7xl px-6 py-16 border-b border-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-medium text-sky-700">01. 類別藍圖與物件實例</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Class 是藍圖，Object 是記憶體中的獨立實體
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            切換下方範例類別並點擊「建立新實例」，觀察同一個類別如何產生多個擁有獨立記憶體位址與
            <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">self</code>
            狀態的物件。
          </p>
        </div>

        {/* Interactive Template Switcher */}
        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-200/70 p-1 self-start">
          {BLUEPRINT_TEMPLATES.map((tpl) => {
            const active = tpl.id === templateId;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleTemplateSwitch(tpl.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tpl.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Zone Sandbox Layout: Left 65% Interactive Stage + Right 35% Control & Concept Deck */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Zone: Interactive Stage (7/12 ~ 60-65%) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="blueprint-grid rounded-xl border border-slate-200 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200/80">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-900">記憶體空間模擬畫布</span>
                <span className="mx-2" aria-hidden="true">·</span>
                <span>點選右側任一實例即可切換 <code className="font-mono text-sky-700">self</code> 指向</span>
              </div>
              <div className="text-xs font-mono text-slate-600 tabular-nums">
                {template.className}.{template.countAttrName} = {instances.length}
              </div>
            </div>

            {/* Blueprint -> Heap Instances Visual Grid */}
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-12 items-start">
              {/* Class Blueprint Box */}
              <div className="md:col-span-5 rounded-lg border border-sky-700/30 bg-white p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="font-mono text-sm font-semibold text-sky-800">
                    class {template.className}
                  </span>
                  <span className="text-xs text-slate-500">藍圖定義</span>
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  <div>
                    <p className="font-medium text-slate-500">類別屬性 (共享)</p>
                    <div className="mt-1 rounded bg-slate-50 px-2.5 py-1.5 font-mono text-slate-800 space-y-1 tabular-nums">
                      <div>{template.classAttrName} = {template.classAttrDefault}</div>
                      <div className="text-sky-700 font-medium">
                        {template.countAttrName} = {instances.length}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium text-slate-500">建構子與方法</p>
                    <ul className="mt-1 space-y-1 font-mono text-slate-700">
                      <li>def __init__(self, ...)</li>
                      {template.methods.map((m) => (
                        <li key={m.name}>def {m.name}(self, ...)</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Arrow Indicator on desktop */}
              <div className="hidden md:flex md:col-span-1 flex-col items-center justify-center pt-16 text-sky-700">
                <svg width="36" height="24" viewBox="0 0 36 24" fill="none" aria-hidden="true">
                  <path d="M2 12H32M32 12L24 5M32 12L24 19" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="mt-1 text-[11px] font-mono text-slate-500 whitespace-nowrap">實例化</span>
              </div>

              {/* Heap Object Instances */}
              <div className="md:col-span-6 space-y-3">
                {instances.map((inst) => {
                  const isSelected = inst.id === selectedInstance.id;
                  return (
                    <div
                      key={inst.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(inst.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(inst.id);
                        }
                      }}
                      className={`rounded-lg border p-3.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                        isSelected
                          ? 'border-sky-600 bg-white ring-2 ring-sky-600/15'
                          : 'border-slate-200 bg-white/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-semibold text-slate-900">{inst.varName}</span>
                          <span className="text-slate-400" aria-hidden="true">·</span>
                          <span className="font-mono text-slate-500 tabular-nums">{inst.address}</span>
                          {isSelected && (
                            <>
                              <span className="text-slate-400" aria-hidden="true">·</span>
                              <span className="font-mono font-semibold text-sky-700">目前 self</span>
                            </>
                          )}
                        </div>
                        {instances.length > 1 && (
                          <button
                            type="button"
                            aria-label={`移除物件 ${inst.varName}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveInstance(inst.id);
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>

                      <div className="mt-2.5 grid grid-cols-3 gap-2 rounded bg-slate-50 px-2.5 py-2 font-mono text-xs tabular-nums">
                        {Object.entries(inst.attrs).map(([k, v]) => (
                          <div key={k} className="truncate">
                            <span className="text-slate-500">{k}: </span>
                            <span className="font-medium text-slate-900">
                              {typeof v === 'string' ? `"${v}"` : v}
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="mt-2 text-xs text-slate-600 truncate">
                        {inst.lastAction}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* __init__ Lifecycle Stepper */}
            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800">
                  __init__ 建構生命週期拆解
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLifecycleStep((s) => (s >= 4 ? 1 : s + 1))}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <StepForward className="h-3.5 w-3.5" aria-hidden="true" />
                    單步追蹤 ({lifecycleStep}/4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLifecycleStep(1)}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    重播
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-4">
                {INIT_LIFECYCLE.map((item) => {
                  const active = item.step === lifecycleStep;
                  const passed = item.step < lifecycleStep;
                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setLifecycleStep(item.step)}
                      className={`rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-sky-600 bg-sky-50/70'
                          : passed
                            ? 'border-slate-200 bg-white'
                            : 'border-slate-200 bg-slate-50/60 opacity-65'
                      }`}
                    >
                      <div className="font-mono text-xs font-semibold text-sky-700 tabular-nums">
                        0{item.step}. {item.label}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.detail}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Class Source Code Reference */}
          <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs text-slate-400">
              <span className="font-mono">{template.className.toLowerCase()}.py</span>
              <span>藍圖原始碼</span>
            </div>
            <pre className="mt-3 overflow-x-auto font-mono text-xs leading-6 text-slate-200">
              <code>{template.sourceCode}</code>
            </pre>
          </div>
        </div>

        {/* Right Zone: Control & Action Deck (5/12 ~ 35-40%) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Instantiate Panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-base font-semibold text-slate-900">
              建立新實例 ({template.className})
            </h3>
            <p className="mt-1 text-xs text-slate-500">{template.subtitle}</p>

            <div className="mt-4 space-y-4">
              {template.fields.map((field) => (
                <div key={field.name}>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                    <label htmlFor={`field-${field.name}`}>{field.label}</label>
                    {field.type === 'number' && (
                      <span className="font-mono text-sky-700 tabular-nums">
                        {formValues[field.name]} {field.unit}
                      </span>
                    )}
                  </div>

                  {field.type === 'text' && (
                    <input
                      id={`field-${field.name}`}
                      type="text"
                      maxLength={14}
                      value={String(formValues[field.name] ?? '')}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [field.name]: e.target.value || 'Unit' }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm text-slate-900 focus:border-sky-600 focus:bg-white focus:outline-none"
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      id={`field-${field.name}`}
                      type="range"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={Number(formValues[field.name] ?? field.defaultValue)}
                      onChange={(e) =>
                        setFormValues((prev) => ({ ...prev, [field.name]: Number(e.target.value) }))
                      }
                      className="mt-2 w-full accent-sky-700 cursor-pointer"
                    />
                  )}

                  {field.type === 'select' && (
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                      {field.options?.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormValues((prev) => ({ ...prev, [field.name]: opt }))}
                          className={`rounded-md border px-2 py-1.5 font-mono text-xs transition-colors cursor-pointer whitespace-nowrap truncate ${
                            formValues[field.name] === opt
                              ? 'border-sky-600 bg-sky-50 font-semibold text-sky-800'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                disabled={instances.length >= 4}
                onClick={handleInstantiate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-300 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {instances.length >= 4
                  ? '已達畫布上限 (4 個實例)'
                  : `建立新實例 (${template.className})`}
              </button>
            </div>
          </div>

          {/* Selected Instance Method Runner */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">
                操作選中物件：<span className="font-mono text-sky-700">{selectedInstance.varName}</span>
              </h3>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                self = {selectedInstance.address}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              呼叫方法時，Python 會自動把 {selectedInstance.varName} 傳入第一個參數 self，因此只會更新這個實例的資料。
            </p>

            <div className="mt-4 space-y-2.5">
              {template.methods.map((method) => (
                <button
                  key={method.name}
                  type="button"
                  onClick={() => handleInvokeMethod(method.name)}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left hover:border-sky-600 hover:bg-sky-50/40 transition-colors cursor-pointer"
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-slate-900">
                      {method.codeLine(selectedInstance.varName)}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">{method.description}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 whitespace-nowrap shrink-0">
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    執行
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Python REPL Log */}
          <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Zap className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              <span>互動執行紀錄 (REPL)</span>
            </div>
            <div className="mt-2.5 space-y-1 font-mono text-xs leading-relaxed text-slate-200">
              {executionLog.map((line, i) => (
                <div key={i} className={line.startsWith('    =>') ? 'text-emerald-300' : 'text-sky-200'}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
