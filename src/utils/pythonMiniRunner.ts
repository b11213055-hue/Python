export interface ExecutionResult {
  success: boolean;
  output: string[];
  error?: string;
}

interface PyMethod {
  params: string[];
  defaults: Record<string, unknown>;
  body: LineNode[];
  isProperty?: boolean;
  isSetter?: boolean;
  propName?: string;
}

interface PyClass {
  name: string;
  parent: string | null;
  classAttrs: Record<string, unknown>;
  methods: Record<string, PyMethod>;
  properties: Record<string, { getter?: PyMethod; setter?: PyMethod }>;
}

interface PyInstance {
  __className: string;
  __pyClass: PyClass;
  attrs: Record<string, unknown>;
}

interface PyClassRef {
  __isPyClassRef: true;
  __pyClass: PyClass;
}

interface LineNode {
  indent: number;
  raw: string;
  lineNo: number;
}

class PyReturnSignal {
  constructor(public value: unknown) {}
}

class PyRaiseSignal {
  constructor(public excType: string, public message: string) {}
}

function isPyInstance(val: unknown): val is PyInstance {
  return typeof val === 'object' && val !== null && '__pyClass' in val && 'attrs' in val;
}

function isPyClassRef(val: unknown): val is PyClassRef {
  return typeof val === 'object' && val !== null && '__isPyClassRef' in val && '__pyClass' in val;
}

function stripComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble && line[i - 1] !== '\\') inSingle = !inSingle;
    else if (ch === '"' && !inSingle && line[i - 1] !== '\\') inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble) {
      return line.slice(0, i);
    }
  }
  return line;
}

function tokenizeLines(code: string): LineNode[] {
  const rawLines = code.replace(/\r\n/g, '\n').split('\n');
  const result: LineNode[] = [];
  rawLines.forEach((rawLine, idx) => {
    const cleaned = stripComment(rawLine).replace(/\t/g, '    ');
    if (cleaned.trim().length === 0) return;
    const indent = cleaned.length - cleaned.trimStart().length;
    result.push({
      indent,
      raw: cleaned.trim(),
      lineNo: idx + 1,
    });
  });
  return result;
}

function splitTopLevel(str: string, sep = ','): string[] {
  const parts: string[] = [];
  let current = '';
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const prev = str[i - 1];
    if (ch === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
    else if (ch === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (ch === '(') depthParen++;
      else if (ch === ')') depthParen--;
      else if (ch === '[') depthBracket++;
      else if (ch === ']') depthBracket--;
      else if (ch === '{') depthBrace++;
      else if (ch === '}') depthBrace--;
      else if (ch === sep && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim().length > 0) parts.push(current.trim());
  return parts;
}

function findTopLevelOperator(expr: string, ops: string[]): { index: number; op: string } | null {
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let inSingle = false;
  let inDouble = false;

  // Scan right-to-left for binary ops to preserve left-associativity
  for (let i = expr.length - 1; i >= 0; i--) {
    const ch = expr[i];
    const prev = expr[i - 1];
    if (ch === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
    else if (ch === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (ch === ')') depthParen++;
      else if (ch === '(') depthParen--;
      else if (ch === ']') depthBracket++;
      else if (ch === '[') depthBracket--;
      else if (ch === '}') depthBrace++;
      else if (ch === '{') depthBrace--;
      else if (depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
        for (const op of ops) {
          if (expr.slice(i - op.length + 1, i + 1) === op) {
            // Avoid matching unary -/+ at start or after another operator
            if ((op === '+' || op === '-') && i === 0) continue;
            if ((op === '+' || op === '-') && /[+\-*/%(,=<>!]\s*$/.test(expr.slice(0, i))) continue;
            // Word boundary check for keyword ops
            if (/^[a-z]+$/.test(op)) {
              const before = expr[i - op.length] ?? ' ';
              const after = expr[i + 1] ?? ' ';
              if (/[A-Za-z0-9_]/.test(before) || /[A-Za-z0-9_]/.test(after)) continue;
            }
            // Avoid matching '=' inside '==', '!=', '<=', '>='
            if (op === '<' || op === '>') {
              if (expr[i + 1] === '=') continue;
            }
            return { index: i - op.length + 1, op };
          }
        }
      }
    }
  }
  return null;
}

function formatPyValue(val: unknown): string {
  if (val === null || val === undefined) return 'None';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return `[${val.map((v) => (typeof v === 'string' ? `'${v}'` : formatPyValue(v))).join(', ')}]`;
  }
  if (isPyInstance(val)) {
    return `<${val.__className} object>`;
  }
  return String(val);
}

export function runPythonOOP(code: string): ExecutionResult {
  const output: string[] = [];
  const classes: Record<string, PyClass> = {};
  const globalScope: Record<string, unknown> = {};
  let stepCounter = 0;
  const MAX_STEPS = 4000;

  function tick() {
    stepCounter++;
    if (stepCounter > MAX_STEPS) {
      throw new Error('執行步驟超過上限，請檢查是否出現無窮迴圈。');
    }
  }

  function resolveMRO(pyClass: PyClass): PyClass[] {
    const chain: PyClass[] = [pyClass];
    let curr = pyClass;
    const seen = new Set<string>([pyClass.name]);
    while (curr.parent) {
      if (seen.has(curr.parent)) {
        throw new Error(`繼承循環錯誤：${curr.parent}`);
      }
      const parentCls = classes[curr.parent];
      if (!parentCls) {
        throw new Error(`NameError: name '${curr.parent}' is not defined`);
      }
      seen.add(parentCls.name);
      chain.push(parentCls);
      curr = parentCls;
    }
    return chain;
  }

  function findMethod(pyClass: PyClass, methodName: string): { method: PyMethod; owner: PyClass } | null {
    for (const cls of resolveMRO(pyClass)) {
      if (cls.methods[methodName]) {
        return { method: cls.methods[methodName], owner: cls };
      }
    }
    return null;
  }

  function findProperty(pyClass: PyClass, propName: string): { getter?: PyMethod; setter?: PyMethod } | null {
    for (const cls of resolveMRO(pyClass)) {
      if (cls.properties[propName]) {
        return cls.properties[propName];
      }
    }
    return null;
  }

  function findClassAttr(pyClass: PyClass, attrName: string): { found: boolean; value: unknown } {
    for (const cls of resolveMRO(pyClass)) {
      if (attrName in cls.classAttrs) {
        return { found: true, value: cls.classAttrs[attrName] };
      }
    }
    return { found: false, value: undefined };
  }

  function mangleName(ownerClassName: string, attrName: string): string {
    if (attrName.startsWith('__') && !attrName.endsWith('__')) {
      return `_${ownerClassName}${attrName}`;
    }
    return attrName;
  }

  function evalAttrGet(target: unknown, attrName: string, currentOwnerClass?: string): unknown {
    if (isPyInstance(target)) {
      const mangled = currentOwnerClass ? mangleName(currentOwnerClass, attrName) : attrName;
      const prop = findProperty(target.__pyClass, attrName);
      if (prop?.getter) {
        return invokeMethod(target, prop.getter, [], target.__pyClass.name);
      }
      if (mangled in target.attrs) {
        return target.attrs[mangled];
      }
      if (attrName in target.attrs) {
        return target.attrs[attrName];
      }
      const clsAttr = findClassAttr(target.__pyClass, attrName);
      if (clsAttr.found) return clsAttr.value;
      throw new Error(`AttributeError: '${target.__className}' object has no attribute '${attrName}'`);
    }
    if (isPyClassRef(target)) {
      const cls = target.__pyClass;
      const clsAttr = findClassAttr(cls, attrName);
      if (clsAttr.found) return clsAttr.value;
      throw new Error(`AttributeError: type object '${cls.name}' has no attribute '${attrName}'`);
    }
    throw new Error(`AttributeError: 無法讀取屬性 '${attrName}'`);
  }

  function evalAttrSet(target: unknown, attrName: string, value: unknown, currentOwnerClass?: string) {
    if (isPyInstance(target)) {
      const prop = findProperty(target.__pyClass, attrName);
      if (prop?.setter) {
        invokeMethod(target, prop.setter, [value], target.__pyClass.name);
        return;
      }
      if (prop && !prop.setter) {
        throw new Error(`AttributeError: property '${attrName}' of '${target.__className}' object has no setter`);
      }
      const mangled = currentOwnerClass ? mangleName(currentOwnerClass, attrName) : attrName;
      target.attrs[mangled] = value;
      return;
    }
    if (isPyClassRef(target)) {
      const cls = target.__pyClass;
      cls.classAttrs[attrName] = value;
      return;
    }
    throw new Error(`AttributeError: 無法設定屬性 '${attrName}'`);
  }

  function invokeMethod(
    instance: PyInstance,
    method: PyMethod,
    args: unknown[],
    ownerClassName: string,
    kwArgs: Record<string, unknown> = {}
  ): unknown {
    const localScope: Record<string, unknown> = {};
    const paramList = method.params;
    if (paramList[0] === 'self') {
      localScope['self'] = instance;
      const restParams = paramList.slice(1);
      restParams.forEach((p, idx) => {
        if (p in kwArgs) {
          localScope[p] = kwArgs[p];
        } else if (idx < args.length) {
          localScope[p] = args[idx];
        } else if (p in method.defaults) {
          localScope[p] = method.defaults[p];
        } else {
          throw new Error(`TypeError: 缺少必要參數 '${p}'`);
        }
      });
    } else {
      paramList.forEach((p, idx) => {
        if (p in kwArgs) localScope[p] = kwArgs[p];
        else if (idx < args.length) localScope[p] = args[idx];
        else if (p in method.defaults) localScope[p] = method.defaults[p];
        else throw new Error(`TypeError: 缺少必要參數 '${p}'`);
      });
    }

    try {
      executeBlock(method.body, localScope, ownerClassName);
    } catch (sig) {
      if (sig instanceof PyReturnSignal) {
        return sig.value;
      }
      throw sig;
    }
    return null;
  }

  function evalExpr(exprRaw: string, localScope: Record<string, unknown>, currentOwnerClass?: string): unknown {
    tick();
    const expr = exprRaw.trim();
    if (!expr) return null;

    // Strip matching outer parentheses
    if (expr.startsWith('(') && expr.endsWith(')')) {
      let depth = 0;
      let matching = true;
      let inS = false;
      let inD = false;
      for (let i = 0; i < expr.length; i++) {
        const ch = expr[i];
        if (ch === "'" && !inD && expr[i - 1] !== '\\') inS = !inS;
        else if (ch === '"' && !inS && expr[i - 1] !== '\\') inD = !inD;
        else if (!inS && !inD) {
          if (ch === '(') depth++;
          else if (ch === ')') depth--;
          if (depth === 0 && i < expr.length - 1) {
            matching = false;
            break;
          }
        }
      }
      if (matching) {
        return evalExpr(expr.slice(1, -1), localScope, currentOwnerClass);
      }
    }

    // f-string
    if ((expr.startsWith('f"') && expr.endsWith('"')) || (expr.startsWith("f'") && expr.endsWith("'"))) {
      const inner = expr.slice(2, -1);
      let out = '';
      let i = 0;
      while (i < inner.length) {
        if (inner[i] === '{') {
          let depth = 1;
          let j = i + 1;
          while (j < inner.length && depth > 0) {
            if (inner[j] === '{') depth++;
            else if (inner[j] === '}') depth--;
            j++;
          }
          const subExpr = inner.slice(i + 1, j - 1);
          out += formatPyValue(evalExpr(subExpr, localScope, currentOwnerClass));
          i = j;
        } else {
          out += inner[i];
          i++;
        }
      }
      return out;
    }

    // String literal
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      // Make sure there are no unescaped internal quotes closing early
      const quote = expr[0];
      let closedEarly = false;
      for (let i = 1; i < expr.length - 1; i++) {
        if (expr[i] === quote && expr[i - 1] !== '\\') {
          closedEarly = true;
          break;
        }
      }
      if (!closedEarly) {
        return expr.slice(1, -1);
      }
    }

    // List literal
    if (expr.startsWith('[') && expr.endsWith(']')) {
      let depth = 0;
      let matching = true;
      for (let i = 0; i < expr.length; i++) {
        if (expr[i] === '[') depth++;
        else if (expr[i] === ']') depth--;
        if (depth === 0 && i < expr.length - 1) {
          matching = false;
          break;
        }
      }
      if (matching) {
        const inner = expr.slice(1, -1).trim();
        if (!inner) return [];
        return splitTopLevel(inner).map((item) => evalExpr(item, localScope, currentOwnerClass));
      }
    }

    // Boolean & None & Number
    if (expr === 'True') return true;
    if (expr === 'False') return false;
    if (expr === 'None') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);

    // Logical ops
    const orOp = findTopLevelOperator(expr, ['or']);
    if (orOp) {
      const left = evalExpr(expr.slice(0, orOp.index), localScope, currentOwnerClass);
      return left ? left : evalExpr(expr.slice(orOp.index + 2), localScope, currentOwnerClass);
    }
    const andOp = findTopLevelOperator(expr, ['and']);
    if (andOp) {
      const left = evalExpr(expr.slice(0, andOp.index), localScope, currentOwnerClass);
      return !left ? left : evalExpr(expr.slice(andOp.index + 3), localScope, currentOwnerClass);
    }
    if (expr.startsWith('not ')) {
      return !Boolean(evalExpr(expr.slice(4), localScope, currentOwnerClass));
    }

    // Comparison ops
    const cmpOp = findTopLevelOperator(expr, ['==', '!=', '<=', '>=', '<', '>']);
    if (cmpOp) {
      const l = evalExpr(expr.slice(0, cmpOp.index), localScope, currentOwnerClass) as number | string | boolean;
      const r = evalExpr(expr.slice(cmpOp.index + cmpOp.op.length), localScope, currentOwnerClass) as number | string | boolean;
      switch (cmpOp.op) {
        case '==': return l === r;
        case '!=': return l !== r;
        case '<=': return l <= r;
        case '>=': return l >= r;
        case '<': return l < r;
        case '>': return l > r;
      }
    }

    // Addition / subtraction
    const addOp = findTopLevelOperator(expr, ['+', '-']);
    if (addOp) {
      const l = evalExpr(expr.slice(0, addOp.index), localScope, currentOwnerClass);
      const r = evalExpr(expr.slice(addOp.index + 1), localScope, currentOwnerClass);
      if (addOp.op === '+') {
        if (typeof l === 'string' || typeof r === 'string') return `${formatPyValue(l)}${formatPyValue(r)}`;
        if (Array.isArray(l) && Array.isArray(r)) return [...l, ...r];
        return Number(l) + Number(r);
      }
      return Number(l) - Number(r);
    }

    // Multiplication / division
    const mulOp = findTopLevelOperator(expr, ['//', '*', '/', '%']);
    if (mulOp) {
      const l = Number(evalExpr(expr.slice(0, mulOp.index), localScope, currentOwnerClass));
      const r = Number(evalExpr(expr.slice(mulOp.index + mulOp.op.length), localScope, currentOwnerClass));
      if (mulOp.op === '*') return l * r;
      if (mulOp.op === '/') return l / r;
      if (mulOp.op === '//') return Math.floor(l / r);
      return l % r;
    }

    // Unary minus
    if (expr.startsWith('-')) {
      return -Number(evalExpr(expr.slice(1), localScope, currentOwnerClass));
    }

    // Function or Method Call: foo(...) or obj.method(...) or super().method(...)
    if (expr.endsWith(')')) {
      // Find matching opening paren for the trailing ')'
      let depth = 0;
      let openIdx = -1;
      let inS = false;
      let inD = false;
      for (let i = expr.length - 1; i >= 0; i--) {
        const ch = expr[i];
        if (ch === "'" && !inD && expr[i - 1] !== '\\') inS = !inS;
        else if (ch === '"' && !inS && expr[i - 1] !== '\\') inD = !inD;
        else if (!inS && !inD) {
          if (ch === ')') depth++;
          else if (ch === '(') {
            depth--;
            if (depth === 0) {
              openIdx = i;
              break;
            }
          }
        }
      }
      if (openIdx > 0) {
        const calleeExpr = expr.slice(0, openIdx).trim();
        const argStr = expr.slice(openIdx + 1, -1).trim();
        const rawArgs = argStr ? splitTopLevel(argStr) : [];
        const posArgs: unknown[] = [];
        const kwArgs: Record<string, unknown> = {};

        for (const ra of rawArgs) {
          const eqMatch = ra.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)\s*([\s\S]+)$/);
          if (eqMatch) {
            kwArgs[eqMatch[1]] = evalExpr(eqMatch[2], localScope, currentOwnerClass);
          } else {
            posArgs.push(evalExpr(ra, localScope, currentOwnerClass));
          }
        }

        // super().method(...)
        if (calleeExpr.startsWith('super().')) {
          const methodName = calleeExpr.slice('super().'.length);
          const selfObj = localScope['self'];
          if (!isPyInstance(selfObj) || !currentOwnerClass) {
            throw new Error('RuntimeError: super() 只能在類別方法中使用');
          }
          const ownerCls = classes[currentOwnerClass];
          if (!ownerCls?.parent || !classes[ownerCls.parent]) {
            throw new Error('RuntimeError: 找不到父類別');
          }
          const found = findMethod(classes[ownerCls.parent], methodName);
          if (!found) {
            throw new Error(`AttributeError: 'super' object has no attribute '${methodName}'`);
          }
          return invokeMethod(selfObj, found.method, posArgs, found.owner.name, kwArgs);
        }

        // Builtins
        if (calleeExpr === 'print') {
          output.push(posArgs.map((a) => formatPyValue(a)).join(' '));
          return null;
        }
        if (calleeExpr === 'len') return Array.isArray(posArgs[0]) || typeof posArgs[0] === 'string' ? posArgs[0].length : 0;
        if (calleeExpr === 'str') return formatPyValue(posArgs[0]);
        if (calleeExpr === 'int') return Math.trunc(Number(posArgs[0]));
        if (calleeExpr === 'float') return Number(posArgs[0]);
        if (calleeExpr === 'min') return Math.min(...(posArgs as number[]));
        if (calleeExpr === 'max') return Math.max(...(posArgs as number[]));
        if (calleeExpr === 'ValueError') {
          return new PyRaiseSignal('ValueError', String(posArgs[0] ?? ''));
        }
        if (calleeExpr === 'isinstance') {
          const obj = posArgs[0];
          const clsRef = posArgs[1] as { __pyClass?: PyClass };
          if (!isPyInstance(obj) || !clsRef?.__pyClass) return false;
          return resolveMRO(obj.__pyClass).some((c) => c.name === clsRef.__pyClass!.name);
        }

        // Class instantiation
        if (classes[calleeExpr]) {
          const cls = classes[calleeExpr];
          const inst: PyInstance = {
            __className: cls.name,
            __pyClass: cls,
            attrs: {},
          };
          const initFound = findMethod(cls, '__init__');
          if (initFound) {
            invokeMethod(inst, initFound.method, posArgs, initFound.owner.name, kwArgs);
          }
          return inst;
        }

        // Method call on target: obj.method(...)
        const lastDot = calleeExpr.lastIndexOf('.');
        if (lastDot > 0) {
          const objExpr = calleeExpr.slice(0, lastDot);
          const methodName = calleeExpr.slice(lastDot + 1);
          const targetObj = evalExpr(objExpr, localScope, currentOwnerClass);

          if (Array.isArray(targetObj)) {
            if (methodName === 'append') {
              targetObj.push(posArgs[0]);
              return null;
            }
          }

          if (isPyInstance(targetObj)) {
            const found = findMethod(targetObj.__pyClass, methodName);
            if (!found) {
              throw new Error(`AttributeError: '${targetObj.__className}' object has no attribute '${methodName}'`);
            }
            return invokeMethod(targetObj, found.method, posArgs, found.owner.name, kwArgs);
          }
        }

        throw new Error(`NameError: name '${calleeExpr}' is not defined`);
      }
    }

    // Attribute access: a.b.c
    const dotParts = splitTopLevel(expr, '.');
    if (dotParts.length > 1) {
      let currentVal = evalExpr(dotParts[0], localScope, currentOwnerClass);
      for (let i = 1; i < dotParts.length; i++) {
        currentVal = evalAttrGet(currentVal, dotParts[i], currentOwnerClass);
      }
      return currentVal;
    }

    // Identifier lookup
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(expr)) {
      if (expr in localScope) return localScope[expr];
      if (expr in globalScope) return globalScope[expr];
      if (classes[expr]) return { __isPyClassRef: true, __pyClass: classes[expr] };
      throw new Error(`NameError: name '${expr}' is not defined`);
    }

    throw new Error(`SyntaxError: 無法解析表達式 '${expr}'`);
  }

  function collectIndentedBlock(lines: LineNode[], startIdx: number, parentIndent: number): { block: LineNode[]; nextIdx: number } {
    const block: LineNode[] = [];
    let i = startIdx;
    while (i < lines.length && lines[i].indent > parentIndent) {
      block.push(lines[i]);
      i++;
    }
    return { block, nextIdx: i };
  }

  function parseDefHeader(raw: string): { name: string; params: string[]; defaults: Record<string, unknown> } {
    const match = raw.match(/^def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*:$/);
    if (!match) {
      throw new Error(`SyntaxError: 無效的函式定義 '${raw}'`);
    }
    const name = match[1];
    const paramsStr = match[2].trim();
    const params: string[] = [];
    const defaults: Record<string, unknown> = {};
    if (paramsStr) {
      for (const p of splitTopLevel(paramsStr)) {
        const eqIdx = p.indexOf('=');
        if (eqIdx > -1) {
          const pName = p.slice(0, eqIdx).trim();
          const pDefault = p.slice(eqIdx + 1).trim();
          params.push(pName);
          defaults[pName] = evalExpr(pDefault, {});
        } else {
          params.push(p.trim());
        }
      }
    }
    return { name, params, defaults };
  }

  function executeBlock(lines: LineNode[], scope: Record<string, unknown>, currentOwnerClass?: string) {
    let i = 0;
    while (i < lines.length) {
      tick();
      const node = lines[i];
      const raw = node.raw;

      if (raw === 'pass') {
        i++;
        continue;
      }

      if (raw.startsWith('return')) {
        const rest = raw.slice('return'.length).trim();
        const val = rest ? evalExpr(rest, scope, currentOwnerClass) : null;
        throw new PyReturnSignal(val);
      }

      if (raw.startsWith('raise ')) {
        const rest = raw.slice('raise '.length).trim();
        const val = evalExpr(rest, scope, currentOwnerClass);
        if (val instanceof PyRaiseSignal) throw val;
        throw new PyRaiseSignal('Exception', formatPyValue(val));
      }

      // Class definition
      if (raw.startsWith('class ')) {
        const clsMatch = raw.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s*\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\))?\s*:$/);
        if (!clsMatch) throw new Error(`SyntaxError: 無效的類別定義 '${raw}'`);
        const className = clsMatch[1];
        const parentName = clsMatch[2] || null;
        if (parentName && parentName !== 'object' && !classes[parentName]) {
          throw new Error(`NameError: name '${parentName}' is not defined`);
        }

        const { block: classBody, nextIdx } = collectIndentedBlock(lines, i + 1, node.indent);
        const newClass: PyClass = {
          name: className,
          parent: parentName === 'object' ? null : parentName,
          classAttrs: {},
          methods: {},
          properties: {},
        };

        let ci = 0;
        let pendingDecorator: string | null = null;
        while (ci < classBody.length) {
          const cNode = classBody[ci];
          if (cNode.raw === 'pass') {
            ci++;
            continue;
          }
          if (cNode.raw.startsWith('@')) {
            pendingDecorator = cNode.raw.slice(1).trim();
            ci++;
            continue;
          }
          if (cNode.raw.startsWith('def ')) {
            const { name: mName, params, defaults } = parseDefHeader(cNode.raw);
            const { block: mBody, nextIdx: nextCi } = collectIndentedBlock(classBody, ci + 1, cNode.indent);
            const methodObj: PyMethod = { params, defaults, body: mBody };

            if (pendingDecorator === 'property') {
              newClass.properties[mName] = { ...(newClass.properties[mName] || {}), getter: methodObj };
            } else if (pendingDecorator && pendingDecorator.endsWith('.setter')) {
              const targetProp = pendingDecorator.slice(0, -'.setter'.length);
              newClass.properties[targetProp] = { ...(newClass.properties[targetProp] || {}), setter: methodObj };
            } else {
              newClass.methods[mName] = methodObj;
            }
            pendingDecorator = null;
            ci = nextCi;
            continue;
          }
          // Class attribute assignment
          const attrAssign = cNode.raw.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)\s*([\s\S]+)$/);
          if (attrAssign) {
            newClass.classAttrs[attrAssign[1]] = evalExpr(attrAssign[2], globalScope);
            ci++;
            continue;
          }
          ci++;
        }

        classes[className] = newClass;
        i = nextIdx;
        continue;
      }

      // try / except
      if (raw === 'try:') {
        const { block: tryBody, nextIdx } = collectIndentedBlock(lines, i + 1, node.indent);
        let j = nextIdx;
        let exceptBody: LineNode[] = [];
        let exceptVar: string | null = null;
        let exceptType: string | null = null;
        if (j < lines.length && lines[j].indent === node.indent && lines[j].raw.startsWith('except')) {
          const exMatch = lines[j].raw.match(/^except(?:\s+([A-Za-z_][A-Za-z0-9_]*))?(?:\s+as\s+([A-Za-z_][A-Za-z0-9_]*))?\s*:$/);
          if (exMatch) {
            exceptType = exMatch[1] || null;
            exceptVar = exMatch[2] || null;
          }
          const res = collectIndentedBlock(lines, j + 1, lines[j].indent);
          exceptBody = res.block;
          j = res.nextIdx;
        }
        try {
          executeBlock(tryBody, scope, currentOwnerClass);
        } catch (err) {
          if (err instanceof PyRaiseSignal) {
            if (!exceptType || err.excType === exceptType || exceptType === 'Exception') {
              if (exceptVar) scope[exceptVar] = err.message;
              executeBlock(exceptBody, scope, currentOwnerClass);
            } else {
              throw err;
            }
          } else {
            throw err;
          }
        }
        i = j;
        continue;
      }

      // if / elif / else
      if (raw.startsWith('if ') && raw.endsWith(':')) {
        const branches: { cond: string | null; body: LineNode[] }[] = [];
        const firstCond = raw.slice(3, -1).trim();
        const firstRes = collectIndentedBlock(lines, i + 1, node.indent);
        branches.push({ cond: firstCond, body: firstRes.block });
        let j = firstRes.nextIdx;

        while (j < lines.length && lines[j].indent === node.indent) {
          if (lines[j].raw.startsWith('elif ') && lines[j].raw.endsWith(':')) {
            const cond = lines[j].raw.slice(5, -1).trim();
            const res = collectIndentedBlock(lines, j + 1, lines[j].indent);
            branches.push({ cond, body: res.block });
            j = res.nextIdx;
          } else if (lines[j].raw === 'else:') {
            const res = collectIndentedBlock(lines, j + 1, lines[j].indent);
            branches.push({ cond: null, body: res.block });
            j = res.nextIdx;
            break;
          } else {
            break;
          }
        }

        for (const br of branches) {
          if (br.cond === null || Boolean(evalExpr(br.cond, scope, currentOwnerClass))) {
            executeBlock(br.body, scope, currentOwnerClass);
            break;
          }
        }
        i = j;
        continue;
      }

      // for loop
      if (raw.startsWith('for ') && raw.endsWith(':')) {
        const forMatch = raw.match(/^for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([\s\S]+):$/);
        if (!forMatch) throw new Error(`SyntaxError: 無效的 for 迴圈 '${raw}'`);
        const iterVar = forMatch[1];
        const iterableVal = evalExpr(forMatch[2], scope, currentOwnerClass);
        const { block: loopBody, nextIdx } = collectIndentedBlock(lines, i + 1, node.indent);
        if (!Array.isArray(iterableVal)) throw new Error('TypeError: 物件不可迭代');
        for (const item of iterableVal) {
          scope[iterVar] = item;
          executeBlock(loopBody, scope, currentOwnerClass);
        }
        i = nextIdx;
        continue;
      }

      // Compound assignment (+=, -=)
      const compMatch = raw.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*(\+=|-=)\s*([\s\S]+)$/);
      if (compMatch) {
        const lhs = compMatch[1];
        const op = compMatch[2];
        const rhsVal = Number(evalExpr(compMatch[3], scope, currentOwnerClass));
        const currVal = Number(evalExpr(lhs, scope, currentOwnerClass));
        const nextVal = op === '+=' ? currVal + rhsVal : currVal - rhsVal;
        if (lhs.includes('.')) {
          const lastDot = lhs.lastIndexOf('.');
          const targetObj = evalExpr(lhs.slice(0, lastDot), scope, currentOwnerClass);
          evalAttrSet(targetObj, lhs.slice(lastDot + 1), nextVal, currentOwnerClass);
        } else {
          scope[lhs] = nextVal;
        }
        i++;
        continue;
      }

      // Assignment (=)
      const assignMatch = raw.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*=(?!=)\s*([\s\S]+)$/);
      if (assignMatch) {
        const lhs = assignMatch[1];
        const rhsVal = evalExpr(assignMatch[2], scope, currentOwnerClass);
        if (lhs.includes('.')) {
          const lastDot = lhs.lastIndexOf('.');
          const targetObj = evalExpr(lhs.slice(0, lastDot), scope, currentOwnerClass);
          evalAttrSet(targetObj, lhs.slice(lastDot + 1), rhsVal, currentOwnerClass);
        } else {
          scope[lhs] = rhsVal;
        }
        i++;
        continue;
      }

      // Expression statement
      evalExpr(raw, scope, currentOwnerClass);
      i++;
    }
  }

  try {
    const tokens = tokenizeLines(code);
    executeBlock(tokens, globalScope);
    return { success: true, output };
  } catch (err) {
    if (err instanceof PyRaiseSignal) {
      return {
        success: false,
        output,
        error: `${err.excType}: ${err.message}`,
      };
    }
    return {
      success: false,
      output,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
