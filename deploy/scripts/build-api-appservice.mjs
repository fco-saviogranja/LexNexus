import { cpSync, existsSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const outputDir = path.join(rootDir, "build", "appservice", "api");
const prismaOutputDir = path.join(outputDir, "node_modules", ".prisma", "client");
const prismaClientOutputDir = path.join(outputDir, "node_modules", "@prisma", "client");
const pciParserPath = path.join(rootDir, "packages", "db", "prisma", "parse-pci-exam.py");
const pciRequirementsPath = path.join(rootDir, "packages", "db", "prisma", "requirements-pci.txt");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

run("pnpm", ["--filter", "@lexnexus/db", "generate"]);

await build({
  entryPoints: [path.join(rootDir, "apps", "api", "src", "server.ts")],
  outfile: path.join(outputDir, "server.cjs"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  tsconfig: path.join(rootDir, "apps", "api", "tsconfig.json"),
  external: ["@prisma/client", ".prisma/client"],
  logLevel: "info",
});

writeFileSync(
  path.join(outputDir, "package.json"),
  JSON.stringify(
    {
      name: "lexnexus-api-appservice",
      private: true,
      scripts: {
        start: "node server.cjs",
      },
      engines: {
        node: "20.x",
      },
    },
    null,
    2,
  ),
);

mkdirSync(path.join(outputDir, "prisma"), { recursive: true });
cpSync(
  path.join(rootDir, "packages", "db", "prisma", "schema.prisma"),
  path.join(outputDir, "prisma", "schema.prisma"),
);
cpSync(pciParserPath, path.join(outputDir, "parse-pci-exam.py"));
cpSync(pciRequirementsPath, path.join(outputDir, "requirements-pci.txt"));

mkdirSync(prismaOutputDir, { recursive: true });
mkdirSync(prismaClientOutputDir, { recursive: true });

const prismaClientSourceDir = realpathSync(
  path.join(rootDir, "packages", "db", "node_modules", "@prisma", "client"),
);
const prismaEngineSourceDir = path.join(
  path.dirname(path.dirname(prismaClientSourceDir)),
  ".prisma",
  "client",
);

cpSync(prismaEngineSourceDir, prismaOutputDir, {
  recursive: true,
  dereference: true,
});
cpSync(prismaClientSourceDir, prismaClientOutputDir, {
  recursive: true,
  dereference: true,
});

const linuxEngine = path.join(prismaOutputDir, "libquery_engine-debian-openssl-3.0.x.so.node");
if (!existsSync(linuxEngine)) {
  console.error("Prisma Linux engine was not generated. Check binaryTargets and rerun the build.");
  process.exit(1);
}

console.log(`API package ready at ${outputDir}`);
