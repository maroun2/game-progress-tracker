# Game Progress Tracker - Decky Plugin

## Release

### Full Release (all steps)

Single command to build, commit, tag, and create GitHub release:

```bash
./release.sh 1.1.XX "Description of changes"
```

**IMPORTANT:** Version must be numbers and dots only (e.g., `1.1.14`), NOT with `v` prefix.

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

1. Go to: https://github.com/maroun2/steam-deck-game-tags/actions
2. Click the latest "Build Plugin Artifact" workflow run
3. Scroll to bottom → Artifacts section
4. Download: `game-progress-tracker` (contains versioned zip)
5. Extract the zip file (named like `game-progress-tracker-1.3.6-abc1234.zip`)
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

### Logs:
- Location: `/home/deck/homebrew/plugins/game-progress-tracker/logs/message.txt`
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
