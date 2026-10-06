import { readdir, readFile } from "node:fs/promises";
import { join, resolve, relative, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
async function filesIn(directory) {
  const batches = await Promise.all((await readdir(directory, { withFileTypes: true })).map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  }));
  return batches.flat();
}
const files = (await Promise.all(["src", "bin", "scripts", "tests"]
  .map((folder) => filesIn(join(root, folder))))).flat().filter((path) => /\.(?:js|mjs)$/.test(path));
const graph = new Map();
for (const file of files) {
  const checked = spawnSync(process.execPath, ["--check", file], { encoding: "utf8", shell: false });
  if (checked.status !== 0) throw new Error(checked.stderr || "Syntax check failed.");
  const source = await readFile(file, "utf8");
  if (/[ \t]+$/m.test(source)) throw new Error("Trailing whitespace: " + relative(root, file));
  const dependencies = [...source.matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/g)]
    .map((match) => resolve(dirname(file), match[1]));
  for (const dependency of dependencies) {
    if (!files.includes(dependency) && !dependency.endsWith(".json")) {
      throw new Error("Unresolved local import: " + relative(root, dependency));
    }
  }
  if (relative(root, file).startsWith("src")) graph.set(file, dependencies);
}
const done = new Set();
function visit(file, path = new Set()) {
  if (path.has(file)) throw new Error("Circular local import: " + relative(root, file));
  if (done.has(file)) return;
  const next = new Set(path).add(file);
  for (const dependency of graph.get(file) ?? []) visit(dependency, next);
  done.add(file);
}
for (const file of graph.keys()) visit(file);
console.log("Syntax, whitespace, import resolution, and cycle checks passed (" + files.length + " files).");
