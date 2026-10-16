// Transpiles the team's RobotC source (a C subset) into JS generators so every
// RobotC `task` runs as a cooperative coroutine. Each loop body yields once, so
// busy-waits like `while (nSysTime - start < d)` advance simulated time the same
// way they burn timeslices on the real Cortex.
// ponytail: regex-level transpiler, covers the C used in ../src; a real C parser
// is the upgrade path if the RobotC code grows pointers/arrays/structs-by-value.

export type Files = Record<string, string>;

const TYPES = "void|int|bool|float|char|task|short|long|word|byte|string";
const VAR_TYPES = "int|bool|float|char|short|long|word|byte|string";

const STR = /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g;

const stripComments = (s: string) =>
  s.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g, (m, str) =>
    str ?? m.replace(/[^\n]/g, ""),
  );

function preprocess(files: Files, entry: string) {
  const defined = new Set<string>();
  const macros: Record<number, string> = {}; // first #define per value wins -> state names
  const out: string[] = [];
  const include = (name: string) => {
    const src = files[name];
    if (src == null) throw new Error(`#include "${name}" not found`);
    const skip: boolean[] = [];
    for (const line of stripComments(src.replace(/\\\r?\n/g, " ")).split("\n")) {
      const m = line.trim().match(/^#\s*(\w+)\s*(.*)$/);
      const active = !skip.includes(true);
      if (!m) {
        if (active) out.push(line);
        continue;
      }
      const [, dir, rest] = m;
      if (dir === "endif") skip.pop();
      else if (dir === "ifndef") skip.push(!active || defined.has(rest.trim()));
      else if (dir === "ifdef") skip.push(!active || !defined.has(rest.trim()));
      else if (!active) continue;
      else if (dir === "include") include(rest.trim().slice(1, -1));
      else if (dir === "define") {
        const [, k, v] = rest.match(/^(\w+)\s*(.*)$/)!;
        defined.add(k);
        if (v) {
          out.push(`const ${k} = ${v};`);
          if (/^\d+$/.test(v) && !(+v in macros)) macros[+v] = k;
        }
      } else if (dir === "pragma") {
        const p = rest.match(/config\(\s*(?:Sensor|Motor)\s*,\s*\w+\s*,\s*(\w+)/);
        if (p) out.push(`const ${p[1]} = "${p[1]}";`);
      }
    }
  };
  include(entry);
  return { code: out.join("\n"), macros };
}

function matchParen(s: string, open: number) {
  for (let i = open, depth = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")" && --depth === 0) return i;
  }
  throw new Error("unbalanced parentheses");
}

// f(x) -> (yield* f(x)) for every generator function, including nested calls.
function wrapCalls(s: string, fns: Set<string>): string {
  const re = /\b([A-Za-z_]\w*)\s*\(/g;
  let out = "";
  let i = 0;
  for (let m; (m = re.exec(s)); ) {
    if (!fns.has(m[1]) || s.slice(0, m.index).endsWith("function* ")) continue;
    const open = m.index + m[0].length - 1;
    const close = matchParen(s, open);
    out += s.slice(i, m.index) + `(yield* ${m[1]}(${wrapCalls(s.slice(open + 1, close), fns)}))`;
    i = re.lastIndex = close + 1;
  }
  return out + s.slice(i);
}

// Insert a `yield` at the top of every loop body.
function yieldInLoops(s: string) {
  s = s.replace(/\bdo\s*\{/g, "do { yield;");
  const re = /\b(while|for)\s*\(/g;
  let out = "";
  let i = 0;
  for (let m; (m = re.exec(s)); ) {
    const close = matchParen(s, m.index + m[0].length - 1);
    const rest = s.slice(close + 1);
    const brace = rest.match(/^\s*\{/);
    if (brace) {
      const at = close + 1 + brace[0].length;
      out += s.slice(i, at) + " yield;";
      i = re.lastIndex = at;
    } else if (!/^\s*;/.test(rest)) {
      throw new Error(`loop without braces is not supported: ${s.slice(m.index, close + 1)}`);
    }
  }
  return out + s.slice(i);
}

export function transpile(files: Files, entry = "main.c") {
  const { code, macros } = preprocess(files, entry);
  const strings: string[] = [];
  let js = code.replace(STR, (m) => `__S${strings.push(m) - 1}__`);

  const structs: string[] = [];
  js = js.replace(/typedef\s+struct\s*\w*\s*\{[^}]*\}\s*(\w+)\s*;/g, (_, n) => (structs.push(n), ""));
  js = js.replace(new RegExp(`^[ \\t]*(?:${TYPES})\\s+\\**\\s*\\w+\\s*\\([^)]*\\)\\s*;`, "gm"), "");

  const fns = new Set(["delay", "wait1Msec", "sleep"]);
  js = js.replace(new RegExp(`\\b(?:${TYPES})\\s+\\**\\s*(\\w+)\\s*\\(([^)]*)\\)\\s*\\{`, "g"), (_, n, params: string) => {
    fns.add(n);
    const names = params.split(",").map((p) => p.match(/(\w+)\s*$/)?.[1]).filter((p) => p && p !== "void");
    return `function* ${n}(${names.join(", ")}) {`;
  });
  if (structs.length) js = js.replace(new RegExp(`\\b(?:${structs.join("|")})\\s+(\\w+)\\s*;`, "g"), "let $1 = {};");

  js = js
    .replace(/\(\s*(?:int|short|long)\s*\)\s*(?=\()/g, "Math.trunc")
    .replace(/\(\s*(?:int|short|long)\s*\)\s*([\w.]+)/g, "Math.trunc($1)")
    .replace(/\(\s*float\s*\)/g, "")
    .replace(new RegExp(`\\bconst\\s+(?:unsigned\\s+)?(?:${VAR_TYPES})(?:\\s*\\*\\s*|\\s+)`, "g"), "const ")
    .replace(new RegExp(`\\b(?:unsigned\\s+)?(?:${VAR_TYPES})(?:\\s*\\*\\s*|\\s+)(?=[A-Za-z_])`, "g"), "let ")
    .replace(/->/g, ".")
    .replace(/([(,]\s*)&(?=[A-Za-z_])/g, "$1")
    .replace(/SensorValue\s*\[\s*(\w+)\s*\]/g, "SensorValue($1)");

  js = yieldInLoops(wrapCalls(js, fns)).replace(/__S(\d+)__/g, (_, n) => strings[+n]);
  return { js, macros };
}

const PRELUDE = `
let nSysTime = 0;
const motor = __hw.motor;
const SensorValue = (n) => __hw.read(n);
const startTask = (t) => __hw.startTask(t);
const suspendTask = (t) => __hw.setSuspended(t, true);
const resumeTask = (t) => __hw.setSuspended(t, false);
const stopTask = (t) => __hw.stopTask(t);
const stopAllTasks = () => __hw.stopAll();
const writeDebugStreamLine = (f, ...a) => __hw.log(f, a);
const writeDebugStream = writeDebugStreamLine;
function* delay(ms) { const end = nSysTime + ms; while (nSysTime < end) yield; }
const wait1Msec = delay, sleep = delay;
const pow = Math.pow, abs = Math.abs, sqrt = Math.sqrt, sin = Math.sin, cos = Math.cos;
const strlen = (s) => s.length;
const strncmp = (a, b, n) => { a = a.slice(0, n); b = b.slice(0, n); return a < b ? -1 : a > b ? 1 : 0; };
const strcmp = (a, b) => strncmp(a, b, Infinity);
`;

const EPILOGUE = `
return {
  main,
  setTime: (t) => { nSysTime = t; },
  peek: () => ({
    state: typeof CURRENT_STATE === "undefined" ? -1 : CURRENT_STATE,
    prev: typeof PREVIOUS_STATE === "undefined" ? -1 : PREVIOUS_STATE,
    orient: typeof CURR_ORIENTATION === "undefined" ? -1 : CURR_ORIENTATION,
  }),
};`;

export type Factory = (hw: unknown) => {
  main: () => Generator;
  setTime: (t: number) => void;
  peek: () => { state: number; prev: number; orient: number };
};

export function compile(files: Files) {
  const { js, macros } = transpile(files);
  const factory = new Function("__hw", PRELUDE + js + EPILOGUE) as Factory;
  return { factory, macros, js };
}

const STOP = Symbol("stopAllTasks");

const printf = (f: string, args: unknown[]) => {
  let i = 0;
  return String(f)
    .replace(/%(?:\.(\d+))?[dfisc%]/g, (m, prec) => {
      if (m === "%%") return "%";
      const v = args[i++];
      if (m.endsWith("d") || m.endsWith("i")) return String(Math.trunc(Number(v)));
      if (m.endsWith("f")) return Number(v).toFixed(prec ? +prec : 2);
      return String(v);
    })
    .trim();
};

// One running RobotC program: its own globals, tasks and motor/sensor ports.
export class Program {
  tasks = new Map<unknown, { gen: Generator; suspended: boolean }>();
  log: { line: string; n: number }[] = [];
  error = "";
  motor: Record<string, number> = {};
  api: ReturnType<Factory>;

  constructor(factory: Factory, read: (port: string) => number) {
    const hw = {
      motor: this.motor,
      read,
      startTask: (fn: () => Generator) => this.tasks.set(fn, { gen: fn(), suspended: false }),
      stopTask: (fn: unknown) => this.tasks.delete(fn),
      setSuspended: (fn: unknown, s: boolean) => {
        const t = this.tasks.get(fn);
        if (t) t.suspended = s;
      },
      stopAll: () => {
        this.tasks.clear();
        for (const k in this.motor) this.motor[k] = 0;
        throw STOP;
      },
      log: (f: string, a: unknown[]) => this.write(printf(f, a)),
    };
    this.api = factory(hw);
    hw.startTask(this.api.main);
  }

  write(line: string) {
    const last = this.log[this.log.length - 1];
    if (last?.line === line) last.n++;
    else if (this.log.push({ line, n: 1 }) > 200) this.log.shift();
  }

  // One 1 ms tick: every live task runs up to `slice` loop iterations, so short
  // sequences between loop tops stay atomic like on the Cortex's timesliced VM.
  step(t: number, slice = 1) {
    if (this.error) return;
    this.api.setTime(t);
    for (const [fn, task] of [...this.tasks]) {
      if (task.suspended || this.tasks.get(fn) !== task) continue;
      try {
        for (let k = 0; k < slice; k++) {
          if (task.gen.next().done) {
            this.tasks.delete(fn);
            break;
          }
          if (task.suspended || this.tasks.get(fn) !== task) break;
        }
      } catch (e) {
        if (e !== STOP) {
          this.error = String(e);
          this.tasks.clear();
          for (const k in this.motor) this.motor[k] = 0;
        }
        return;
      }
    }
  }
}
