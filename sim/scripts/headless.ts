// Headless smoke test (CI runs it before deploying): compile ../src and play one best-of-3 match.
// Asserts what must hold regardless of luck; the sim is chaotic, so scores aren't pinned.
// Run: pnpm check
import { readFileSync, readdirSync } from "node:fs";
import { compile } from "../lib/robotc.ts";
import { World } from "../lib/world.ts";

const dir = new URL("../../src/", import.meta.url);
const files = Object.fromEntries(readdirSync(dir).map((f) => [f, readFileSync(new URL(f, dir), "utf8")]));
const world = new World(compile(files).factory);

let pickedUp = false;
while (!world.matchOver) {
  if (world.balls.length !== 3 || world.balls.some((b) => b.state !== "free")) throw new Error("each round must start with 3 free balls");
  while (!world.ended) {
    world.tick();
    pickedUp ||= world.robots.some((r) => r.held);
  }
  for (const bot of world.robots) if (bot.prog.error) throw new Error(`${bot.name}: ${bot.prog.error}`);
  const out = world.robots.filter((r) => r.out).map((r) => (r.home ? "red" : "blue"));
  console.log(`${world.result} in ${(world.t / 1000).toFixed(1)}s${out.length ? `, out: ${out.join(" + ")}` : ""}`);
  if (!world.matchOver) world.reset();
}
if (!pickedUp) throw new Error("no robot picked up a ball all match");
console.log("ok");
