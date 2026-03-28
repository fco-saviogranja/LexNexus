import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const appDir = path.join(rootDir, "apps", "web");
const standaloneDir = path.join(appDir, ".next", "standalone");
const staticDir = path.join(appDir, ".next", "static");
const publicDir = path.join(appDir, "public");
const outputDir = path.join(rootDir, "build", "appservice", "web");
const relativeAppDir = path.relative(rootDir, appDir);
const appStandaloneDir = path.join(standaloneDir, relativeAppDir);
const packageJsonPath = path.join(appDir, "package.json");

function run(command, args, cwd = rootDir, envOverrides = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      ...envOverrides,
    },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyChildren(sourceDir, targetDir) {
  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name === "node_modules") {
      continue;
    }
    cpSync(path.join(sourceDir, entry.name), path.join(targetDir, entry.name), {
      recursive: true,
      dereference: true,
    });
  }
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

const productionApiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.lexnexus.tech";

run("pnpm", ["--filter", "@lexnexus/web", "build"], rootDir, {
  NEXT_PUBLIC_API_URL: productionApiUrl,
});

if (!existsSync(appStandaloneDir)) {
  console.error(`Standalone app directory not found: ${appStandaloneDir}`);
  process.exit(1);
}

copyChildren(appStandaloneDir, outputDir);
cpSync(packageJsonPath, path.join(outputDir, "package.json"));

mkdirSync(path.join(outputDir, ".next"), { recursive: true });
cpSync(staticDir, path.join(outputDir, ".next", "static"), {
  recursive: true,
  dereference: true,
});

if (existsSync(publicDir)) {
  cpSync(publicDir, path.join(outputDir, "public"), {
    recursive: true,
    dereference: true,
  });
}

run("npm", [
  "install",
  "--omit=dev",
  "--no-package-lock",
  "--no-fund",
  "--no-audit",
], outputDir);

console.log(`Web package ready at ${outputDir}`);
