#!/bin/bash

set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
env_file="$repo_dir/.env.codex.local"

if [[ ! -f "$env_file" ]]; then
  echo "Missing $env_file" >&2
  exit 1
fi

token="$(sed -n 's/^BREVO_MCP_TOKEN=//p' "$env_file" | tail -n 1)"

if [[ -z "$token" || "$token" == "PASTE_NEW_BREVO_MCP_TOKEN_HERE" ]]; then
  echo "Set BREVO_MCP_TOKEN in $env_file first." >&2
  exit 1
fi

launchctl setenv BREVO_MCP_TOKEN "$token"
echo "BREVO_MCP_TOKEN loaded for apps launched after this command."
echo "Fully quit and reopen Codex."
