# Deck Progress Tracker - Decky Plugin

## Release

### Full Release (all steps)

Single command to build, commit, tag, and create GitHub release:

```bash
./release.sh 1.1.XX "Description of changes"
```

**IMPORTANT:** Version must be numbers and dots only (e.g., `1.1.14` or `1.3.0`), NEVER with `v` prefix (NOT `v1.3.0`).

### Granular Control

The release script supports granular control with flags:

**Skip specific steps:**
```bash
./release.sh 1.2.0 "Description" --skip-commit       # Don't commit to git
./release.sh 1.2.0 "Description" --skip-release      # Don't create GitHub release
./release.sh 1.2.0 "Description" --skip-build        # Don't build (use existing dist/)
./release.sh 1.2.0 "Description" --skip-version      # Don't update version files
```

**Only run specific steps:**
```bash
./release.sh 1.2.0 "Description" --only-build        # Only build frontend
./release.sh 1.2.0 "Description" --only-version      # Only update version numbers
./release.sh 1.2.0 "Description" --only-package      # Only create zip package
./release.sh 1.2.0 "Description" --only-commit       # Only commit and push
./release.sh 1.2.0 "Description" --only-release      # Only create GitHub release
```

**Additional options:**
```bash
./release.sh 1.2.0 "Description" --only-commit --no-push  # Commit but don't push
```

### What the script does:

1. Updates version in package.json and plugin.json
2. Builds the frontend (`npm run build`)
3. Creates plugin zip package
4. Commits all changes to git
5. Pushes to origin
6. Creates and pushes git tag
7. Creates GitHub release with install URL

## Automated Development Builds

Every commit to `main` branch automatically builds a test artifact via GitHub Actions.

### How to Download Test Builds:

1. Go to: https://github.com/maroun2/deck-progress-tracker/actions
2. Click the latest "Build Plugin Artifact" workflow run
3. Scroll to bottom → Artifacts section
4. Download: `deck-progress-tracker` (contains versioned zip)
5. Extract the zip file (named like `deck-progress-tracker-1.3.6-abc1234.zip`)
6. Copy to Steam Deck: `~/homebrew/plugins/`
7. Restart Decky Loader

**Version format:** `{last-tag}-{commit-sha}` (e.g., `1.3.6-abc1234`)

- Version is automatically derived from latest git tag + short commit SHA
- Version is updated in package.json, plugin.json, and VERSION file
- Artifacts expire after 90 days

**Note:** Artifacts require GitHub login to download. For stable releases, use the release process below.

## Testing on Steam Deck

### Stable Releases:
1. Create release using `./release.sh X.Y.Z "Description"`
2. Install via Decky Loader > Developer Mode > Install from URL
3. Use the install URL from release notes

### Development Builds:
1. Download artifact from GitHub Actions (see above)
2. Manually extract and copy to `~/homebrew/plugins/`
3. Restart Decky Loader

### Important File Locations on Steam Deck:
- **Database**: `/home/deck/homebrew/data/deck-progress-tracker/game_tracker.db`
- **Plugin files**: `/home/deck/homebrew/plugins/deck-progress-tracker/`
- **Logs**: `/home/deck/homebrew/logs/deck-progress-tracker/` (latest log file)

### Debugging Commands:
```bash
# SSH into Steam Deck (replace password)
sshpass -p "YOUR_DECK_PASSWORD" ssh deck@192.168.253.187

# Delete database for fresh sync
rm /home/deck/homebrew/data/deck-progress-tracker/game_tracker.db

# View latest log
ls -t /home/deck/homebrew/logs/deck-progress-tracker/ | head -1
tail -100 /home/deck/homebrew/logs/deck-progress-tracker/[latest-log-file]

# Download log to local machine
./dev-console-scripts/download-latest-log.sh 192.168.253.187
```

### Logs:
- All frontend logs go to backend via `log_frontend()` - no CEF debugging needed

## CEF Debugging

For debugging the Steam Deck frontend using Chrome DevTools Protocol (CDP), see `dev-console-scripts/README.md` for available scripts and usage.

## Key Architecture

- **Frontend** (Settings.tsx): Gets playtime from `window.appStore.GetAppOverviewByAppID()`
- **Backend** (main.py): Receives playtime, fetches achievements, queries HLTB
- **Communication**: `@decky/api` call() function
- **Route Patching** (patchLibraryApp.tsx): Uses ProtonDB-style safe patching with `afterPatch`, `findInReactTree`, `createReactTreePatcher`

## Decky API Notes

- `call()` passes all parameters as a single dict to Python backend
- Use `_extract_params()` helper in backend to unpack parameters
- Non-Steam games have appids in shortcuts.vdf (binary format)

## Project Structure

### Key Files
- **src/components/TagIcon.tsx** - Icon components for all tag types (mastered, completed, in_progress, backlog, dropped)
- **src/components/Settings.tsx** - Main plugin UI with tag sections, sync controls, and about section
- **src/index.tsx** - Plugin entry point with FaTrophy icon
- **plugin.json** - Plugin metadata, requires `"flags": ["_root"]` for installation to work!
- **main.py** - Python backend with database, HLTB integration, and tag logic

### Icons
- Plugin icon: `FaTrophy` from react-icons/fa
- Mastered tag: `FaTrophy` from react-icons/fa (pink #f5576c)
- Completed tag: Custom CheckCircleIcon (green #38ef7d)
- In Progress tag: Custom ClockIcon (purple #764ba2)
- Backlog tag: Custom EmptyCircleIcon (gray #888)
- Dropped tag: Custom XCircleIcon (tan #c9a171)

### Tag Priority System
1. **Mastered** (highest) - 85%+ achievements
2. **Completed** - Playtime ≥ HLTB main story time
3. **Dropped** - Not played for 365+ days
4. **In Progress** - Playtime ≥ 30 minutes
5. **Backlog** (lowest) - No significant playtime

### Dependencies
- **react-icons** - For FaTrophy and other icons
- **@decky/api** - Decky Loader API
- **@decky/ui** - Decky UI components (ButtonItem, PanelSection, etc.)

## Common Issues & Fixes

### Plugin Won't Install
- Check `plugin.json` has `"flags": ["_root"]` - REQUIRED for installation!
- Version must match in package.json and plugin.json

### GitHub Actions Build Uses Wrong Version
- Check if tag is properly pushed: `git tag -l 1.3.0 --format='%(refname:short) -> %(objectname:short)'`
- If tag points to wrong commit: `git tag -d 1.3.0 && git tag 1.3.0 && git push origin :refs/tags/1.3.0 && git push origin 1.3.0`

### TypeScript Build Warnings
- `HTMLCollection` iterator warnings in GameTagBadge.tsx - can be ignored
- `Type 'null' cannot be used as index` in Settings.tsx - non-critical type warnings

## Screenshots & Assets
- Plugin screenshot: `/assets/plugin-screenshot.jpg`
- Shows Settings UI with tag sections
- Used as store banner in plugin.json

## Recent Updates (1.3.0)
- Dropped tag system for abandoned games
- Full gamepad navigation with D-pad support
- Universal sync progress tracking
- GitHub Actions automated builds
- UI improvements with proper Decky components
- Settings UI margins and scroll position fixes
- About section with donation message
- Plugin icon changed to FaTrophy
- Mastered tag icon changed to FaTrophy
