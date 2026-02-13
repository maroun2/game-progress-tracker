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

## Testing on Steam Deck

1. Create release so the zip is available to download
2. Install via Decky Loader > Developer Mode > Install from URL
3. Use the install URL from release notes
4. Logs at: `/home/deck/homebrew/plugins/game-progress-tracker/logs/message.txt`
5. All frontend logs go to backend via `log_frontend()` - no CEF debugging needed

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
