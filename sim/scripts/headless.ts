// Headless check: compile ../src, play matches without a browser, assert the robots score.
// Run: npm run check
import { readFileSync, readdirSync } from "node:fs";
import { compile } from "../lib/robotc.ts";
import { CAL, World } from "../lib/world.ts";

// fixed seed (mulberry32) so ball layouts, spawns and sensor noise repeat run to run
let seed = Number(process.env.SEED ?? 1);
Math.random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const dir = new URL("../../src/", import.meta.url);
const files = Object.fromEntries(readdirSync(dir).map((f) => [f, readFileSync(new URL(f, dir), "utf8")]));
const { factory } = compile(files);

const rounds = Number(process.argv[2] ?? 10);
const world = new World(factory);
let scored = 0;
for (let r = 1; r <= rounds; r++) {
  if (world.balls.length !== 3 || world.balls.some((b) => b.state !== "free")) throw new Error("each round must start with 3 free balls");
  while (!world.ended) world.tick();
  const [a, b] = world.robots;
  for (const bot of world.robots) if (bot.prog.error) throw new Error(`${bot.name}: ${bot.prog.error}`);
  scored += a.score + b.score;
  const out = world.robots.filter((x) => x.out).map((x) => x.name.split(" ")[1]);
  console.log(`round ${r}: blue ${a.score} - red ${b.score} in ${(world.t / 1000).toFixed(1)}s${out.length ? `  out: ${out.join(", ")}` : ""}`);
  world.reset();
}
console.log(`total balls scored: ${scored} / ${rounds * CAL.balls}`);
if (scored < rounds) throw new Error(`expected at least ${rounds} balls scored`);
