#!/usr/bin/env node
import { runCli } from "../src/cli.js";

try {
  process.exitCode = await runCli(process.argv.slice(2));
} catch (error) {
  const message = error?.code === "EEXIST"
    ? "Report already exists. Choose a different output file."
    : error?.code
      ? "Local file or command operation failed (" + error.code + "). Check permissions and available disk space."
      : String(error?.message ?? "Operation failed.").replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 240);
  process.stderr.write("Driftline: " + message + "\n");
  process.exitCode = 2;
}
