# Repository guidance

## Scope

This repository owns one presentation-only DSH Web Client skin. Keep task boards, SSH, skills, marketplaces, workspace trees, model selection, and message transport in DSH or their owning plugins.

## Build and verify

- Install with `corepack pnpm install --frozen-lockfile`.
- Run the complete gate with `corepack pnpm run check`.
- Commit `lib/index.js`, `lib/client.js`, and generated `skin.build.json` with source changes.
- Generate build metadata through `scripts/write-skin-build.mjs`; keep its repository path as `.`.

## Lifecycle

Treat every DOM mutation, body attribute, style property, observer, timer, listener, and injected node as skin-owned state. Register cleanup before fallible work. Restore the captured value only while the current activation still owns the value being replaced.

Keep selectors scoped to `body[data-dsh-wuhu-traffic-agent]`. Preserve native behavior in light and dark themes, narrow and wide sidebars, conversation and workspace views, and browser and desktop layouts.

## Layering

DSH owns menu 100, Modal 1000, and portal menu 1100. Skin chrome must stay below 1000. While Settings is open, retain the promoted app root and release sidebar ancestor stacking contexts so the official fixed dialog can paint at page level.

Use `[id='root']` in CSS Modules. Avoid document-wide `:has()` selectors and ignore mutation churn below `.xterm` and `[data-input-backdrop]`.

## Distribution

Do not commit `node_modules`, `*.js.map`, absolute machine paths, or bundles that require remote runtime assets. Keep CC BY-NC-SA 4.0 and the complete `NOTICE` attribution chain. Confirm police-emblem authorization before public distribution or operational use.
