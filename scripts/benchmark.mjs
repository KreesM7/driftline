import { performance } from "node:perf_hooks";
import { runCli } from "../src/cli.js";

// Measures this Node process only; native probe subprocess memory is excluded.
let peakMainRss = process.memoryUsage().rss;
const sampler = setInterval(() => {
  peakMainRss = Math.max(peakMainRss, process.memoryUsage().rss);
}, 10);
const start = performance.now();
try {
  await runCli(["check", "--no-history", "--json"], { write: () => {} });
} finally {
  clearInterval(sampler);
}
peakMainRss = Math.max(peakMainRss, process.memoryUsage().rss);
console.log(JSON.stringify({
  platform: process.platform,
  node: process.version,
  wallSeconds: Number(((performance.now() - start) / 1000).toFixed(3)),
  sampledPeakMainRssMiB: Number((peakMainRss / 1024 / 1024).toFixed(2)),
  subprocessMemoryIncluded: false,
  historySaved: false,
}, null, 2));
