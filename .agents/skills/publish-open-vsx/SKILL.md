---
name: publish-open-vsx
description: Use when publishing or re-publishing this VS Code extension to the Open VSX registry, including bumping versions, packaging the .vsix, and pushing to open-vsx.org.
---

# Publish to Open VSX

## Overview
Builds the extension, packages a `.vsix`, and publishes it to [open-vsx.org](https://open-vsx.org) under the `terryhuanghd` namespace. The PAT is read from the `OVSX_PAT` environment variable — never hardcoded, never committed.

## Prerequisites
- `ovsx` CLI installed (`npm install -g ovsx` or use `npx ovsx`)
- `node_modules` installed (`npm install`)
- `OVSX_PAT` exported in the shell (see "Loading the token" below)
- Namespace `terryhuanghd` already exists on Open VSX (one-time setup, already done)

## Loading the token

Do **not** paste the token into a command line or commit it. Pick one:

```bash
# Option A — per-shell (ephemeral)
export OVSX_PAT="ovsxat_..."

# Option B — load from a gitignored file
set -a; source .env.local; set +a   # .env.local must be in .gitignore
```

Verify it is set without printing it:
```bash
[ -n "$OVSX_PAT" ] && echo "OVSX_PAT is set" || echo "OVSX_PAT is MISSING"
```

## Publish workflow

1. **Bump `version` in `package.json`** if this is a new release. Open VSX rejects republishing the same version.
2. **Package the extension:**
   ```bash
   npm run package:vsix
   ```
   Produces `package-inspector-<version>.vsix` in the repo root.
3. **Publish:**
   ```bash
   npx ovsx publish package-inspector-<version>.vsix
   ```
   `ovsx` automatically picks up `OVSX_PAT` from the environment — no `-p` flag needed.
4. **Verify:** open `https://open-vsx.org/extension/terryhuanghd/package-inspector` and confirm the new version is listed.

## One-time namespace setup (already done)

If publishing under a fresh publisher fails with `Unknown publisher: <name>`:
```bash
ovsx create-namespace <publisher-name>
```

## Common mistakes

| Symptom | Fix |
|---------|-----|
| `Unknown publisher: terryhuanghd` | Run `ovsx create-namespace terryhuanghd` once. |
| `Extension <id>@<v> already exists` | Bump the `version` field in `package.json` and re-package. |
| `OVSX_PAT` empty / 401 unauthorized | Re-export the token, or rotate it on open-vsx.org → User Settings → Tokens. |
| `WARNING A 'repository' field is missing` | Cosmetic for publishing, but add a `repository` field in `package.json` for a better marketplace listing. |
| Token leaked into chat / commit / logs | Rotate immediately at open-vsx.org → User Settings → Tokens; revoke the old one. |

## Security notes
- Never write `OVSX_PAT` into any tracked file (`.env.local` must be gitignored).
- Never pass the token via `ovsx publish -p <token>` in shared terminals — it lands in shell history and `ps`.
- If the token is ever shared in chat, transcripts, or logs, rotate it.
