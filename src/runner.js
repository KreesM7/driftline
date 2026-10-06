import { execFile as nativeExecFile } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, delimiter, extname, isAbsolute, join } from "node:path";

const ALLOWED_COMMANDS = new Set([
  "powershell.exe",
  "powershell",
  "softwareupdate",
  "fdesetup",
  "defaults",
  "systemsetup",
  "socketfilterfw",
  "ufw",
  "systemctl",
  "lsblk",
  "apt-get",
  "dnf",
  "pacman",
]);

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_BUFFER = 128 * 1024;

function commandKey(command) {
  return basename(command).toLowerCase();
}

function assertAllowed(command, args) {
  const fixedMacPath = command === "/usr/libexec/ApplicationFirewall/socketfilterfw";
  if (typeof command !== "string" ||
      (!fixedMacPath && (command.includes("/") || command.includes("\\"))) ||
      !ALLOWED_COMMANDS.has(commandKey(command))) {
    throw new Error("Requested command is not allowed by Driftline.");
  }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== "string" || arg.includes("\0"))) {
    throw new Error("Command arguments are invalid.");
  }
}

async function canExecute(candidate) {
  try {
    await access(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function defaultCommandExists(command) {
  if (isAbsolute(command)) {
    return canExecute(command);
  }
  const hasExtension = extname(command) !== "";
  const extensions = process.platform === "win32" && !hasExtension
    ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";")
    : [""];
  const folders = (process.env.PATH || "").split(delimiter).filter(Boolean);

  for (const folder of folders) {
    for (const extension of extensions) {
      if (await canExecute(join(folder, `${command}${extension}`))) {
        return true;
      }
    }
  }
  return false;
}

function capText(value, maxBuffer) {
  const text = String(value || "");
  return text.length > maxBuffer ? text.slice(0, maxBuffer) : text;
}

export function createRunner(options = {}) {
  const execFileImpl = options.execFileImpl || nativeExecFile;
  const commandExists = options.commandExists || defaultCommandExists;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const maxBuffer = options.maxBuffer || DEFAULT_MAX_BUFFER;

  async function has(command) {
    assertAllowed(command, []);
    return commandExists(command);
  }

  async function run(command, args) {
    assertAllowed(command, args);
    if (!(await commandExists(command))) {
      return Object.freeze({ ok: false, code: "NOT_FOUND", stdout: "", stderr: "", timedOut: false });
    }

    return new Promise((resolve) => {
      const finish = (error, stdout, stderr) => {
        const timedOut = Boolean(error && (error.killed || error.signal === "SIGTERM"));
        const code = error?.code ?? 0;
        resolve(Object.freeze({
          ok: !error,
          code,
          stdout: capText(stdout, maxBuffer),
          stderr: capText(stderr, maxBuffer),
          timedOut,
        }));
      };

      try {
        execFileImpl(command, args, {
          shell: false,
          windowsHide: true,
          timeout: timeoutMs,
          maxBuffer,
          encoding: "utf8",
        }, finish);
      } catch {
        finish({ code: "EXECUTION_ERROR" }, "", "");
      }
    });
  }

  return Object.freeze({ has, run });
}

export { ALLOWED_COMMANDS };
