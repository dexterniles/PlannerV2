#!/usr/bin/env node
import { readFileSync } from "node:fs";

const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
};
const pass = (msg) => console.log(`✓ ${msg}`);

const root = new URL("../", import.meta.url);
const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

const readPkg = (name) => {
  try {
    return JSON.parse(
      readFileSync(new URL(`node_modules/${name}/package.json`, root), "utf8"),
    );
  } catch {
    return null;
  }
};

// 1. motion is the React-19-compatible package and >= 11.15
const motion = readPkg("motion");
if (!motion) fail("motion not installed");
else {
  const ver = motion.version.split(".").map(Number);
  const ok = ver[0] > 11 || (ver[0] === 11 && ver[1] >= 15);
  if (!ok) fail(`motion ${motion.version} is below required 11.15`);
  else pass(`motion ${motion.version}`);
  const peer = motion.peerDependencies?.react ?? "(none)";
  console.log(`  motion peer react: ${peer}`);
}

// 2. Tailwind 4
const tw = readPkg("tailwindcss");
if (!tw) fail("tailwindcss not installed");
else if (!tw.version.startsWith("4.")) fail(`tailwindcss ${tw.version} is not v4`);
else pass(`tailwindcss ${tw.version}`);

// 3. drizzle versions exact, no caret
const drizzleOrm = pkg.dependencies?.["drizzle-orm"] ?? "";
const drizzleKit = pkg.devDependencies?.["drizzle-kit"] ?? "";
if (drizzleOrm !== "0.45.2") fail(`drizzle-orm pin must be exact "0.45.2", got "${drizzleOrm}"`);
else pass(`drizzle-orm pinned 0.45.2`);
if (drizzleKit !== "0.31.10") fail(`drizzle-kit pin must be exact "0.31.10", got "${drizzleKit}"`);
else pass(`drizzle-kit pinned 0.31.10`);

// 4. supabase ssr 0.10+
const ssr = readPkg("@supabase/ssr");
if (!ssr) fail("@supabase/ssr not installed");
else {
  const [maj, min] = ssr.version.split(".").map(Number);
  const ok = maj > 0 || (maj === 0 && min >= 10);
  if (!ok) fail(`@supabase/ssr ${ssr.version} below 0.10`);
  else pass(`@supabase/ssr ${ssr.version}`);
}

// 5. react / react-dom resolved versions
const react = readPkg("react");
const reactDom = readPkg("react-dom");
if (react?.version !== "19.2.4") fail(`react resolved to ${react?.version}, expected 19.2.4`);
else pass(`react ${react.version}`);
if (reactDom?.version !== "19.2.4") fail(`react-dom resolved to ${reactDom?.version}, expected 19.2.4`);
else pass(`react-dom ${reactDom.version}`);

// 6. next pinned exact
const next = readPkg("next");
if (next?.version !== "16.2.4") fail(`next resolved to ${next?.version}, expected 16.2.4`);
else pass(`next ${next.version}`);

if (process.exitCode) {
  console.error("\nverify:deps failed");
} else {
  console.log("\nverify:deps OK");
}
