import { runPciImportFromCli } from "../src/pci-import.js";

runPciImportFromCli(process.argv.slice(2)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
