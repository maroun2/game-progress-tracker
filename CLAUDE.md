# Game Progress Tracker - Decky Plugin

## Build & Release

```bash
# Build release (updates version in plugin.json and package.json)
./build-plugin.sh v1.0.XX

# Creates: game-progress-tracker-v1.0.XX.zip with correct folder structure
```

## GitHub Release

**IMPORTANT:** Always include installation URL in release notes!

```bash
gh release create v1.0.XX game-progress-tracker-v1.0.XX.zip --title "v1.0.XX - Title" --notes "$(cat <<'EOF'
## Game Progress Tracker v1.0.XX

### Installation

**Install from URL (Recommended)**
1. Enable Developer Mode in Decky Loader settings
2. Go to Developer tab → Install Plugin from URL
3. Enter this URL:
\`\`\`
https://github.com/maroun2/steam-deck-game-tags/releases/download/v1.0.XX/game-progress-tracker-v1.0.XX.zip
\`\`\`
4. Click Install and wait for completion
EOF
)"
```

## Testing on Steam Deck

0. Create release so the zip is avaiable to download to the steam deck
1. Install zip via Decky Loader > Developer Mode > Install from URL
2. Logs at: `/home/deck/homebrew/plugins/game-progress-tracker/logs/message.txt`
3. All frontend logs go to backend via `log_frontend()` - no CEF debugging needed

## Key Architecture

- **Frontend** (Settings.tsx): Gets playtime from `window.appStore.GetAppOverviewByAppID()`
- **Backend** (main.py): Receives playtime, fetches achievements, queries HLTB
- **Communication**: `@decky/api` call() function

