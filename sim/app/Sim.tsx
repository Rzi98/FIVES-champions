"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { compile, type Files } from "@/lib/robotc.ts";
import { CAL, World, toWorld, type Robot } from "@/lib/world.ts";

const S = 220; // px per metre
const M = 40; // margin px
const px = (x: number, y: number): [number, number] => [M + y * S, M + x * S]; // base-to-base runs left -> right

function draw(ctx: CanvasRenderingContext2D, w: World, rays: boolean) {
  const { fieldW: W, fieldL: L, baseW, baseDepth, tape, robotL, robotW, ballR } = CAL;
  ctx.fillStyle = "#1d2a1f";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#2e4a33";
  ctx.fillRect(...px(0, 0), L * S, W * S);
  ctx.strokeStyle = "#f5f5f5";
  ctx.lineWidth = tape * S;
  ctx.strokeRect(...px(tape / 2, tape / 2), (L - tape) * S, (W - tape) * S);
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#ffffff40";
  ctx.beginPath();
  ctx.moveTo(...px(0, L / 2));
  ctx.lineTo(...px(W, L / 2));
  ctx.stroke();
  ctx.setLineDash([]);
  // delivery boxes behind each end line, goalpost position
  const bx = (W - baseW) / 2;
  for (const [y, color] of [[-baseDepth, "#3b82f6"], [L, "#ef4444"]] as const) {
    ctx.fillStyle = color + "66";
    ctx.fillRect(...px(bx, y), baseDepth * S, baseW * S);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(...px(bx, y), baseDepth * S, baseW * S);
  }
  for (const [y, n] of [[-baseDepth / 2, w.robots[0]?.score], [L + baseDepth / 2, w.robots[1]?.score]])
    for (let i = 0; i < (n ?? 0); i++) {
      ctx.fillStyle = "#d4f03c";
      ctx.beginPath();
      ctx.arc(...px(W / 2 + (i - 1) * 0.1, y), ballR * S, 0, 2 * Math.PI);
      ctx.fill();
    }

  for (const b of w.balls) {
    if (b.state === "scored") continue;
    ctx.fillStyle = "#d4f03c";
    ctx.beginPath();
    ctx.arc(...px(b.x, b.y), ballR * S, 0, 2 * Math.PI);
    ctx.fill();
  }

  for (const r of w.robots) {
    if (rays && !r.out)
      for (const ray of r.rays) {
        const [ex, ey] = [ray.from[0] - Math.sin(r.h) * ray.d, ray.from[1] + Math.cos(r.h) * ray.d];
        ctx.strokeStyle = r.color + "70";
        ctx.beginPath();
        ctx.moveTo(...px(...ray.from));
        ctx.lineTo(...px(ex, ey));
        ctx.stroke();
      }
    ctx.save();
    ctx.globalAlpha = r.out ? 0.35 : 1;
    ctx.translate(...px(r.x, r.y));
    ctx.rotate(-r.h); // local +X = forward, -Y = robot's left
    const [hl, hw] = [(robotL / 2) * S, (robotW / 2) * S];
    ctx.fillStyle = r.color;
    ctx.fillRect(-hl, -hw, 2 * hl, 2 * hw);
    ctx.fillStyle = "#14532d"; // green wheels
    for (const [wx, wy] of [[-hl + 4, -hw - 4], [hl - 22, -hw - 4], [-hl + 4, hw - 4], [hl - 22, hw - 4]])
      ctx.fillRect(wx, wy, 18, 8);
    ctx.fillStyle = (r.prog.motor.roller_motor ?? 0) ? "#fb923c" : "#777"; // roller
    ctx.fillRect(hl - 6, -hw + 3, 6, 2 * hw - 6);
    if (r.held) {
      ctx.fillStyle = "#d4f03c";
      ctx.beginPath();
      ctx.arc(0.03 * S, 0, ballR * S, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
    const [lx, ly] = px(...toWorld(r, 0, 0));
    ctx.fillStyle = "#fff";
    ctx.fillText(r.out ? "OUT" : r.prog.error ? "ERROR" : "", lx - 12, ly - 30);
  }
}

function Panel({ r, macros }: { r: Robot; macros: Record<number, string> }) {
  const p = r.prog.api.peek();
  const port = (k: string) => r.ports[k] ?? "-";
  return (
    <div style={{ border: `2px solid ${r.color}`, borderRadius: 6, padding: 10, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: r.color }}>
        <span>{r.name}</span>
        <span>{r.out ? "OUT · " : ""}{r.score} scored</span>
      </div>
      {r.prog.error && <pre style={{ color: "#f87171", whiteSpace: "pre-wrap" }}>{r.prog.error}</pre>}
      <div>state <b>{macros[p.state] ?? p.state}</b> <span style={{ color: "#888" }}>prev {macros[p.prev] ?? p.prev}</span></div>
      <div>compass {p.orient}° · holding {r.held ? "ball" : "nothing"}</div>
      <div style={{ color: "#aaa" }}>
        sharp L {port("leftBallSensor")} R {port("rightBallSensor")} front {port("frontOppSensor")} back {port("backOppSensor")}
      </div>
      <div style={{ color: "#aaa" }}>
        line FL{port("leftFrontLine")} FR{port("rightFrontLine")} BL{port("leftBackLine")} BR{port("rightBackLine")} · limit back {port("backLeftLimit")}
        {port("backRightLimit")} collector {port("collectorLimit")}
      </div>
      <div style={{ color: "#aaa" }}>
        motors {Object.entries(r.prog.motor).map(([k, v]) => `${k.replace("_motor", "")}=${v}`).join(" ")}
      </div>
      <pre style={{ marginTop: 6, color: "#9ca3af", fontSize: 11, height: 120, overflow: "hidden" }}>
        {r.prog.log.slice(-9).map((l) => `${l.line}${l.n > 1 ? `  ×${l.n}` : ""}`).join("\n")}
      </pre>
    </div>
  );
}

export default function Sim({ files }: { files: Files }) {
  const compiled = useMemo(() => {
    try {
      return compile(files);
    } catch (e) {
      return { error: String(e) } as const;
    }
  }, [files]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const world = useRef<World | null>(null);
  const [speed, setSpeed] = useState(2);
  const [paused, setPaused] = useState(false);
  const [rays, setRays] = useState(true);
  const [opponent, setOpponent] = useState(true);
  const [, rerender] = useState(0);
  const live = useRef({ speed, paused, rays });
  live.current = { speed, paused, rays };

  useEffect(() => {
    if ("error" in compiled) return;
    world.current = new World(compiled.factory, opponent);
  }, [compiled, opponent]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastUi = 0;
    const frame = (now: number) => {
      const w = world.current;
      const ctx = canvas.current?.getContext("2d");
      const dt = Math.min(now - last, 100);
      last = now;
      if (w && ctx) {
        if (!live.current.paused) for (let i = 0; i < Math.round(dt * live.current.speed); i++) w.tick();
        draw(ctx, w, live.current.rays);
        if (now - lastUi > 100) {
          lastUi = now;
          rerender((n) => n + 1);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  if ("error" in compiled) return <pre style={{ padding: 20, color: "#f87171" }}>RobotC transpile error: {compiled.error}</pre>;
  const w = world.current;
  const left = w ? Math.max(0, CAL.matchMs - (w.ended || w.t)) / 1000 : 0;

  return (
    <main style={{ display: "flex", gap: 16, padding: 16, alignItems: "flex-start" }}>
      <div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <button onClick={() => setPaused(!paused)}>{paused ? "▶ Play" : "⏸ Pause"}</button>
          <button onClick={() => world.current?.newMatch()}>↺ Restart match</button>
          <select value={speed} onChange={(e) => setSpeed(+e.target.value)}>
            {[1, 2, 5].map((s) => (
              <option key={s} value={s}>{s}×</option>
            ))}
          </select>
          <label><input type="checkbox" checked={rays} onChange={(e) => setRays(e.target.checked)} /> sensor rays</label>
          <label><input type="checkbox" checked={opponent} onChange={(e) => setOpponent(e.target.checked)} /> opponent</label>
        </div>
        <canvas ref={canvas} width={CAL.fieldL * S + 2 * M} height={CAL.fieldW * S + 2 * M} style={{ borderRadius: 6 }} />
        {w && (
          <div style={{ marginTop: 8, fontSize: 15 }}>
            Best of 3 · round {w.round}/3 · {Math.floor(left / 60)}:{String(Math.floor(left % 60)).padStart(2, "0")} left ·{" "}
            {w.balls.filter((b) => b.state === "scored").length}/{CAL.balls} balls home
            <br />
            Rounds won: blue {w.roundWins[0]} – red {w.roundWins[1]}
            {w.matchOver ? " · match over, replaying…" : ""}
            {w.result && <div style={{ color: "#facc15", fontWeight: "bold" }}>{w.result}</div>}
          </div>
        )}
      </div>
      <div style={{ width: 420 }}>
        {w?.robots.map((r) => <Panel key={r.name} r={r} macros={compiled.macros} />)}
        <p style={{ color: "#777" }}>
          Running the RobotC in <code>../src</code>, transpiled in the browser. Edit it and refresh. Calibration knobs: <code>CAL</code> in{" "}
          <code>lib/world.ts</code>.
        </p>
      </div>
    </main>
  );
}
