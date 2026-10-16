import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import Sim from "./Sim";

// Reads the RobotC source at build time (static export); `pnpm dev` re-reads it on every refresh.

export default function Page() {
  const dir = path.join(process.cwd(), "..", "src");
  const files = Object.fromEntries(
    readdirSync(dir)
      .filter((f) => /\.(c|h)$/.test(f))
      .map((f) => [f, readFileSync(path.join(dir, f), "utf8")]),
  );
  return <Sim files={files} />;
}
