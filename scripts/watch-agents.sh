#!/usr/bin/env bash
# Watch all Bloom Bastion agents.
#
# iTerm2:    opens a 2x2 AppleScript split-pane grid
# Alacritty / any other terminal: attaches to the tmux watch window directly
#
# Usage: ./scripts/watch-agents.sh

SESSION="bloom-agents"

if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Error: session '$SESSION' not found. Run ./scripts/multiagent.sh first." >&2
  exit 1
fi

# Detect iTerm2 — $TERM_PROGRAM is set to "iTerm.app" inside iTerm2 sessions,
# and ITERM_SESSION_ID is set in every iTerm2 pane.
if [[ "${TERM_PROGRAM:-}" == "iTerm.app" || -n "${ITERM_SESSION_ID:-}" ]]; then
  TMPSCRIPT=$(mktemp /tmp/bloom-watch-XXXX.scpt)
  cat > "$TMPSCRIPT" << 'APPLESCRIPT'
tell application "iTerm2"
  activate
  set W to (create window with default profile)
  tell W
    tell current tab
      -- Top-left: engine
      tell current session
        write text "tmux attach-session -t bloom-agents \\; select-window -t 🔧engine"
      end tell

      -- Top-right: gameplay
      set s2 to (split vertically with default profile)
      tell s2
        write text "tmux attach-session -t bloom-agents \\; select-window -t 🎮play"
      end tell

      -- Bottom-left: ui
      set s3 to (split horizontally with default profile)
      tell s3
        write text "tmux attach-session -t bloom-agents \\; select-window -t 🎨ui"
      end tell

      -- Bottom-right: qa
      tell s2
        set s4 to (split horizontally with default profile)
        tell s4
          write text "tmux attach-session -t bloom-agents \\; select-window -t ✅qa"
        end tell
      end tell
    end tell
  end tell
end tell
APPLESCRIPT
  osascript "$TMPSCRIPT"
  rm -f "$TMPSCRIPT"
  echo "Opened 2x2 pane layout in iTerm2."
else
  # Alacritty / Warp / any terminal — use the tmux watch window
  # multiagent.sh already built it: left=orchestrator, right=agents stacked
  if tmux list-windows -t "$SESSION" -F '#{window_name}' 2>/dev/null | grep -q 'watch'; then
    tmux attach-session -t "$SESSION" \; select-window -t "$SESSION:👁watch"
  else
    echo "No watch window found (terminal may have been too small when multiagent.sh ran)."
    echo "Attach manually: tmux attach-session -t $SESSION"
    echo "Then Ctrl+b <number> to jump to any agent window."
  fi
fi
