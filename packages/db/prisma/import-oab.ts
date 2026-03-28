import { runOabImportFromCli } from "../src/oab-import.js";

runOabImportFromCli(process.argv.slice(2)).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
