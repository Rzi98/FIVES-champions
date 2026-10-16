// Field physics + simulated VEX hardware for the robots running the RobotC program.
// Field frame: x = across the field (0..fieldW), y = base to base (0..fieldL).
// Heading h (rad) follows the robot's compass: 0 = +y (away from blue base), increasing anticlockwise.

import { Program, type Factory } from "./robotc.ts";

// Calibration knobs — tune these to match the real robot / arena.
export const CAL = {
  fieldW: 2.4, // m, side line to side line
  fieldL: 3.6, // m, base to base
  baseW: 0.8, // m, delivery box width, centred behind each end line like a goalpost
  baseDepth: 0.15, // m, how far the box sits behind the end line
  tape: 0.03, // m, boundary tape width
  robotL: 0.28,
  robotW: 0.24,
  track: 0.22, // m, left-right wheel spacing
  // m/s per motor unit, calibrated so PANNING_SPEED (45) spins 360° in SPIN_TIME (3666 ms)
  motorK: ((2 * Math.PI) / 3.666) * 0.22 / 90,
  leftTrim: 1, // drive asymmetry, e.g. 0.97 if the left side runs slow
  rightTrim: 1,
  ballR: 0.0335,
  intakeHalfW: 0.11, // m, roller + guide arms catch balls this far off-centre
  // Sharp IR curve V = v0 * (d0 / d)^0.84. GP2Y0A21 (10-80 cm): v0 2.3 V @ 0.10 m.
  // Swap to GP2Y0A02 (20-150 cm) with { v0: 2.5, d0: 0.2, min: 0.15, range: 1.5 }.
  sharp: { v0: 2.3, d0: 0.1, min: 0.08, range: 0.8 },
  sharpNoise: 15, // ADC counts
  sliceLoops: 20, // loop iterations each RobotC task gets per 1 ms timeslice
  compassOffset: 0, // deg, mounting error
  matchMs: 90_000,
  balls: 3,
};

const COMPASS_CODE: Record<number, number> = {
  0: 0b0111, 45: 0b0110, 90: 0b1110, 135: 0b1100, 180: 0b1101, 225: 0b1001, 270: 0b1011, 315: 0b0011,
};

export type Ball = { x: number; y: number; state: "free" | "held" | "scored" };

export type Robot = {
  name: string;
  color: string;
  home: 0 | 1; // 0 = base at y=0, 1 = base at y=fieldL
  x: number;
  y: number;
  h: number;
  held: Ball | null;
  out: boolean; // left the arena: stopped for the rest of the round, score is final
  score: number;
  ports: Record<string, number>; // sensor readings for this ms
  rays: { from: [number, number]; d: number }[];
  prog: Program;
};

const fwd = (h: number) => [-Math.sin(h), Math.cos(h)];
const left = (h: number) => [-Math.cos(h), -Math.sin(h)];

export function toWorld(r: { x: number; y: number; h: number }, f: number, l: number): [number, number] {
  const [fx, fy] = fwd(r.h);
  const [lx, ly] = left(r.h);
  return [r.x + fx * f + lx * l, r.y + fy * f + ly * l];
}

function toLocal(r: Robot, px: number, py: number) {
  const dx = px - r.x;
  const dy = py - r.y;
  const [fx, fy] = fwd(r.h);
  const [lx, ly] = left(r.h);
  return { f: dx * fx + dy * fy, l: dx * lx + dy * ly };
}

const ROBOT_R = 0.15; // collision / sharp-target radius of a robot

function rayCircle(px: number, py: number, dx: number, dy: number, cx: number, cy: number, r: number) {
  const ox = px - cx;
  const oy = py - cy;
  const b = ox * dx + oy * dy;
  const disc = b * b - (ox * ox + oy * oy - r * r);
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t >= 0 ? t : Infinity;
}

const inBase = (x: number) => Math.abs(x - CAL.fieldW / 2) <= CAL.baseW / 2;

export class World {
  t = 0;
  balls: Ball[] = [];
  robots: Robot[] = [];
  // one best-of-3 match on loop: ends when someone takes 2 rounds or after round 3, then replays from 0-0
  round = 0;
  roundWins = [0, 0];
  matchOver = false;
  result = ""; // banner for the round that just ended
  ended = 0; // sim time the round ended, 0 while running
  private startPressedUntil = 150;
  private factory: Factory;
  private withOpponent: boolean;

  constructor(factory: Factory, withOpponent = true) {
    this.factory = factory;
    this.withOpponent = withOpponent;
    this.reset();
  }

  reset() {
    this.t = 0;
    this.ended = 0;
    this.result = "";
    this.round++;
    const { fieldW: W, fieldL: L, robotL } = CAL;
    this.balls = [];
    while (this.balls.length < CAL.balls) {
      const b: Ball = { x: 0.3 + Math.random() * (W - 0.6), y: 0.7 + Math.random() * (L - 1.4), state: "free" };
      if (this.balls.every((o) => Math.hypot(o.x - b.x, o.y - b.y) > 0.4)) this.balls.push(b);
    }
    const spawn = (name: string, color: string, home: 0 | 1): Robot => {
      const r: Robot = {
        name, color, home,
        x: W / 2 + (Math.random() - 0.5) * (CAL.baseW - CAL.robotW), // start backed onto own box
        y: home ? L - robotL / 2 : robotL / 2,
        h: home ? Math.PI : 0,
        held: null, out: false, score: 0, ports: {}, rays: [],
        prog: null!,
      };
      r.prog = new Program(this.factory, (port) => r.ports[port] ?? 0);
      return r;
    };
    this.robots = [spawn("FIVES (blue)", "#3b82f6", 0)];
    if (this.withOpponent) this.robots.push(spawn("Opponent (red, same code)", "#ef4444", 1));
  }

  newMatch() {
    this.round = 0;
    this.roundWins = [0, 0];
    this.matchOver = false;
    this.reset();
  }

  setOpponent(on: boolean) {
    this.withOpponent = on;
    this.newMatch();
  }

  // Advance 1 ms.
  tick() {
    if (this.ended) {
      if (this.t - this.ended > (this.matchOver ? 5000 : 2500)) {
        if (this.matchOver) this.newMatch();
        else this.reset();
      }
      else this.t++;
      return;
    }
    for (const r of this.live()) this.readSensors(r);
    for (const r of this.live()) r.prog.step(this.t, CAL.sliceLoops);
    for (const r of this.live()) this.drive(r);
    this.collide();
    // ponytail: "exited" = centre crossed the arena boundary; switch to all-corners-out if the rules are more lenient
    for (const r of this.live())
      if (r.x < 0 || r.x > CAL.fieldW || r.y < 0 || r.y > CAL.fieldL) {
        r.out = true;
        r.prog.tasks.clear();
        for (const k in r.prog.motor) r.prog.motor[k] = 0;
        r.prog.write(`OUT OF ARENA at ${(this.t / 1000).toFixed(1)}s, final score ${r.score}`);
      }
    this.t++;
    const live = this.live();
    // a ball held by a robot that's out is gone for the round
    const playable = this.balls.some((b) => b.state === "free" || live.some((r) => r.held === b));
    if (!playable || this.t >= CAL.matchMs || live.every((r) => r.prog.error)) {
      this.ended = this.t;
      const [a, b] = this.robots.map((r) => r.score);
      if (b !== undefined && a !== b) this.roundWins[a > b ? 0 : 1]++;
      this.result = b === undefined ? `Round ${this.round}: ${a} scored` : a === b ? `Round ${this.round} drawn ${a}-${b}` : `${a > b ? "Blue" : "Red"} wins round ${this.round} (${a}-${b})`;
      const [bw, rw] = this.roundWins;
      this.matchOver = this.round >= 3 || Math.max(bw, rw) >= 2;
      if (this.matchOver && b !== undefined) this.result += bw === rw ? ". Match drawn" : `. ${bw > rw ? "Blue" : "Red"} wins the match ${bw}-${rw}!`;
    }
  }

  live() {
    return this.robots.filter((r) => !r.out);
  }

  private sharp(r: Robot, f: number, l: number, back: boolean, seesLow: boolean) {
    const [px, py] = toWorld(r, f, l);
    let [dx, dy] = fwd(r.h);
    if (back) [dx, dy] = [-dx, -dy];
    let d = Infinity;
    for (const o of this.live()) if (o !== r) d = Math.min(d, rayCircle(px, py, dx, dy, o.x, o.y, ROBOT_R));
    if (seesLow) {
      // ball sensors sit low: they see balls and the (low) base boxes, opp sensors only see robots
      for (const b of this.balls)
        if (b.state === "free") d = Math.min(d, rayCircle(px, py, dx, dy, b.x, b.y, CAL.ballR + 0.005));
      for (const wy of [0, CAL.fieldL]) {
        const t = dy ? (wy - py) / dy : -1;
        if (t > 0 && inBase(px + dx * t)) d = Math.min(d, t);
      }
    }
    const { v0, d0, min, range } = CAL.sharp;
    r.rays.push({ from: [px, py], d: Math.min(d, range) * (back ? -1 : 1) });
    // 12-bit ADC over 5 V; past max range the output floors around 0.3 V
    const volts = d > range ? 0.3 : v0 * (d0 / Math.max(d, min)) ** 0.84;
    return Math.max(0, Math.round(volts * 819 + (Math.random() - 0.5) * 2 * CAL.sharpNoise));
  }

  private touching(r: Robot, f: number, l: number) {
    const [px, py] = toWorld(r, f, l);
    if (inBase(px) && (py <= 0.004 || py >= CAL.fieldL - 0.004)) return true;
    return this.live().some((o) => o !== r && Math.hypot(o.x - px, o.y - py) <= ROBOT_R + 0.01);
  }

  private onTape(r: Robot, f: number, l: number) {
    const [x, y] = toWorld(r, f, l);
    const { fieldW: W, fieldL: L, tape } = CAL;
    const inside = x >= 0 && x <= W && y >= 0 && y <= L;
    return inside && (x < tape || x > W - tape || y < tape || y > L - tape);
  }

  private readSensors(r: Robot) {
    const hf = CAL.robotL / 2;
    const hw = CAL.robotW / 2;
    const p = r.ports;
    r.rays = [];
    p.leftBallSensor = this.sharp(r, hf, 0.07, false, true);
    p.rightBallSensor = this.sharp(r, hf, -0.07, false, true);
    p.frontOppSensor = this.sharp(r, hf, 0, false, false);
    p.backOppSensor = this.sharp(r, -hf, 0, true, false);
    // digital limit switches read 0 when pressed; front ones are wired to analog ports
    p.backLeftLimit = this.touching(r, -hf - 0.002, 0.08) ? 0 : 1;
    p.backRightLimit = this.touching(r, -hf - 0.002, -0.08) ? 0 : 1;
    p.leftFrontLimit = this.touching(r, hf + 0.002, hw - 0.02) ? 0 : 4095;
    p.rightFrontLimit = this.touching(r, hf + 0.002, -hw + 0.02) ? 0 : 4095;
    p.collectorLimit = r.held ? 0 : 1;
    p.mainLimit = this.t >= 50 && this.t < this.startPressedUntil ? 0 : 1; // auto-press start
    // line sensors read 0 on the tape
    p.leftFrontLine = this.onTape(r, hf - 0.02, hw - 0.02) ? 0 : 1;
    p.rightFrontLine = this.onTape(r, hf - 0.02, -hw + 0.02) ? 0 : 1;
    p.leftBackLine = this.onTape(r, -hf + 0.02, hw - 0.02) ? 0 : 1;
    p.rightBackLine = this.onTape(r, -hf + 0.02, -hw + 0.02) ? 0 : 1;
    // 8-direction compass, each robot's 0° points away from its own base
    const deg = (((r.h * 180) / Math.PI + (r.home ? 180 : 0) + CAL.compassOffset) % 360 + 360) % 360;
    const code = COMPASS_CODE[(Math.round(deg / 45) % 8) * 45];
    p.compass_LSB = (code >> 3) & 1;
    p.compass_Bit2 = (code >> 2) & 1;
    p.compass_Bit3 = (code >> 1) & 1;
    p.compass_MSB = code & 1;
  }

  private drive(r: Robot) {
    const m = r.prog.motor;
    const clamp = (v = 0) => Math.max(-127, Math.min(127, v));
    // left motor is mounted mirrored: forward = left negative, right positive
    const vL = -clamp(m.left_motor) * CAL.motorK * CAL.leftTrim;
    const vR = clamp(m.right_motor) * CAL.motorK * CAL.rightTrim;
    const dt = 0.001;
    const v = (vL + vR) / 2;
    r.h += ((vR - vL) / CAL.track) * dt;
    const [fx, fy] = fwd(r.h);
    r.x += fx * v * dt;
    r.y += fy * v * dt;

    const hf = CAL.robotL / 2;
    if (r.held) {
      [r.held.x, r.held.y] = toWorld(r, 0.03, 0);
      if ((m.gate_motor ?? 0) > 0) {
        // gate opens: ball rolls out the back, into the box if we're backed onto our own base
        const atHome =
          r.ports.backLeftLimit === 0 && r.ports.backRightLimit === 0 && inBase(r.x) &&
          Math.abs(r.y - (r.home ? CAL.fieldL : 0)) < hf + 0.05;
        if (atHome) {
          r.held.state = "scored";
          r.score++;
        } else {
          r.held.state = "free";
          [r.held.x, r.held.y] = toWorld(r, -hf - CAL.ballR - 0.01, 0);
        }
        r.held = null;
      }
    }
  }

  private collide() {
    const { fieldW: W, fieldL: L, robotL, robotW, ballR } = CAL;
    const hf = robotL / 2;
    const hw = robotW / 2;
    for (const r of this.live()) {
      // base boxes are solid
      const corners = [[hf, hw], [hf, -hw], [-hf, hw], [-hf, -hw]].map(([f, l]) => toWorld(r, f, l));
      const lo = Math.min(...corners.filter(([x]) => inBase(x)).map(([, y]) => y));
      const hi = Math.max(...corners.filter(([x]) => inBase(x)).map(([, y]) => y));
      // pushing a corner into the base pivots the chassis flush against it
      const pen = Math.max(-lo, hi - L, 0);
      if (pen > 0) {
        const square = Math.round(r.h / Math.PI) * Math.PI;
        r.h += Math.sign(square - r.h) * Math.min(Math.abs(square - r.h), pen * 20);
      }
      if (lo < 0) r.y -= lo;
      if (hi > L) r.y -= hi - L;
      r.x = Math.max(-0.5, Math.min(W + 0.5, r.x));
      r.y = Math.max(-0.3, Math.min(L + 0.3, r.y));
    }
    const [a, b] = this.live();
    if (b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy);
      if (d < 2 * ROBOT_R && d > 0) {
        const push = (2 * ROBOT_R - d) / 2 / d;
        a.x -= dx * push; a.y -= dy * push;
        b.x += dx * push; b.y += dy * push;
      }
    }
    for (const ball of this.balls) {
      if (ball.state !== "free") continue;
      for (const r of this.live()) {
        const { f, l } = toLocal(r, ball.x, ball.y);
        const rollerOn = (r.prog.motor.roller_motor ?? 0) !== 0;
        if (rollerOn && !r.held && f > hf - 0.03 && f < hf + ballR + 0.01 && Math.abs(l) < CAL.intakeHalfW) {
          ball.state = "held";
          r.held = ball;
          break;
        }
        const pf = hf + ballR - Math.abs(f);
        const pl = hw + ballR - Math.abs(l);
        if (pf > 0 && pl > 0) {
          const [nf, nl] = pf < pl ? [Math.sign(f) * (hf + ballR), l] : [f, Math.sign(l) * (hw + ballR)];
          [ball.x, ball.y] = toWorld(r, nf, nl);
        }
      }
      ball.x = Math.max(-0.3, Math.min(W + 0.3, ball.x));
      ball.y = Math.max(ballR, Math.min(L - ballR, ball.y));
    }
  }
}
