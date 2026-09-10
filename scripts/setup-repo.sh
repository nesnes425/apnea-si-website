#!/usr/bin/env bash
#
# Apnea.si website repo setup.
#
# Run this once on every computer that works on the website:
#
#     bash scripts/setup-repo.sh
#
# It makes sure Claude Code and Codex read exactly the same project rules, and switches
# on the automatic commit check. It is safe to run again at any time.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CHANGED=0

say()  { printf '%s\n' "$*"; }
ok()   { printf '  ok    %s\n' "$*"; }
fix()  { printf '  fixed %s\n' "$*"; CHANGED=1; }
warn() { printf '  !!    %s\n' "$*"; }

say ""
say "Apnea.si website setup"
say "======================"
say ""

# ---------------------------------------------------------------------------
# 1. AGENTS.md is the real file, CLAUDE.md is a second name for it.
# ---------------------------------------------------------------------------
say "Instruction file (AGENTS.md / CLAUDE.md)"

if [ ! -f AGENTS.md ] || [ -L AGENTS.md ]; then
  warn "AGENTS.md is missing or is itself a shortcut. Stopping so nothing is lost."
  warn "Ask Claude or Codex to look at this before continuing."
  exit 1
fi

if [ -L CLAUDE.md ] && [ "$(readlink CLAUDE.md)" = "AGENTS.md" ]; then
  ok "CLAUDE.md already points at AGENTS.md"
else
  if [ -e CLAUDE.md ] && [ ! -L CLAUDE.md ]; then
    if cmp -s CLAUDE.md AGENTS.md; then
      rm -f CLAUDE.md
    else
      BACKUP="../CLAUDE.md.backup-$(date +%Y-%m-%d-%H%M%S)"
      mv CLAUDE.md "$BACKUP"
      warn "CLAUDE.md was a separate file with different content."
      warn "A copy was saved next to this repo as $BACKUP so nothing is lost."
      warn "Check whether anything in it still needs to move into AGENTS.md."
    fi
  else
    rm -f CLAUDE.md
  fi
  ln -s AGENTS.md CLAUDE.md
  fix "CLAUDE.md now points at AGENTS.md"
fi

# ---------------------------------------------------------------------------
# 2. Automatic check before every commit.
# ---------------------------------------------------------------------------
say ""
say "Automatic commit check"

chmod +x .githooks/* 2>/dev/null || true

if [ "$(git config --get core.hooksPath || true)" = ".githooks" ]; then
  ok "already switched on"
else
  git config core.hooksPath .githooks
  fix "switched on"
fi

# ---------------------------------------------------------------------------
say ""
if [ "$CHANGED" -eq 1 ]; then
  say "Done. Some things were repaired above."
  say "Run 'git status' to see what changed, then commit if it looks right."
else
  say "Done. Everything was already set up correctly."
fi
say ""
