#!/usr/bin/env bash
# send-task.sh — reliably deliver a task to a Bloom Bastion agent's Claude session.
#
# Claude Code uses bracketed-paste mode — a bare `tmux send-keys ... Enter`
# pastes text into the input buffer but the Enter is swallowed. This script
# does the two-step: paste via buffer, pause, then send a bare Enter to submit.
#
# Usage:
#   ./scripts/send-task.sh <agent> <message>
#
#   <agent>   — one of: engine | gameplay | ui | qa | orchestrator
#   <message> — task text (quote it)
#
# Examples:
#   ./scripts/send-task.sh engine   "implement bitECS world + components per SPEC §4.2"
#   ./scripts/send-task.sh gameplay "add Stormcloud chain-lightning tower (SPEC §6.1)"
#   ./scripts/send-task.sh ui       "build TowerPicker HUD using design tokens"
#   ./scripts/send-task.sh qa       "run bun run check"

set -euo pipefail

SESSION="bloom-agents"

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <agent> <message>" >&2
  echo "  agents: engine | gameplay | ui | qa | orchestrator" >&2
  exit 1
fi

agent="$1"
shift
message="$*"

case "$agent" in
  orchestrator) window="🎯orch" ;;
  engine)       window="🔧engine" ;;
  gameplay)     window="🎮play" ;;
  ui)           window="🎨ui" ;;
  qa)           window="✅qa" ;;
  # also accept full emoji names directly
  *)            window="$agent" ;;
esac

if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "tmux session '$SESSION' not found. Start it with scripts/multiagent.sh." >&2
  exit 1
fi

if ! tmux list-windows -t "$SESSION" -F "#{window_name}" | grep -qx "$window"; then
  echo "Window '$window' not found in session '$SESSION'." >&2
  echo "Available windows:" >&2
  tmux list-windows -t "$SESSION" -F "  #{window_name}" >&2
  exit 1
fi

# Load message into a tmux buffer and paste it with bracketed-paste markers.
# send-keys alone races against Claude Code's bracketed-paste mode on long
# messages — the Enter gets swallowed inside the paste. paste-buffer -p sends
# the proper \033[200~…\033[201~ wrapper so the REPL treats the whole text as
# pasted input, then the explicit Enter below submits it.
tmpfile=$(mktemp /tmp/bloom-task-XXXXXX)
printf '%s' "$message" > "$tmpfile"
tmux load-buffer "$tmpfile"
rm -f "$tmpfile"
tmux paste-buffer -t "${SESSION}:${window}" -p
sleep 0.5
tmux send-keys -t "${SESSION}:${window}" Enter

echo "→ sent to ${window}"
