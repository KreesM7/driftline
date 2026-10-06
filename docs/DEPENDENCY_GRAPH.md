# Dependency graph substitute

Graphify returned no_workspace. No competing or local Graphify graph was produced. This diagram comes from local imports. npm run check verifies import resolution and rejects cycles.

```mermaid
flowchart TD
  bin --> cli
  cli --> probes
  cli --> runner
  cli --> state
  cli --> presentation
  cli --> model
  probes --> shared
  shared --> model
  shared --> pack
  pack --> model
  pack --> data["data-only core.json"]
  state --> model
  presentation --> model
  presentation --> pack
  presentation --> i18n
```

App modules use Node standard-library modules only. Runner is the sole app module importing child_process. The limited static guard found no network imports. This is not a complete behavioral or dead-code proof.
