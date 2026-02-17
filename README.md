# Game Progress Tracker

A Decky Loader plugin for Steam Deck that automatically tags your games based on completion status, playtime, and achievements.

## Features

- **Intelligent 5-Tag System**
  - **Mastered** - Games with 85%+ achievements unlocked
  - **Completed** - Beat the main story (playtime ≥ HLTB main story time)
  - **Dropped** - Games not played for over 1 year
  - **In Progress** - Currently playing (playtime ≥ 30 minutes)
  - **Backlog** - Not started yet (no playtime or minimal playtime)

- **HowLongToBeat Integration** - Fetches game completion times to determine "Completed" status

- **Full Gamepad Navigation** - Complete D-pad support for all UI elements with proper focus highlighting

- **Manual Override** - Change any tag manually if automatic detection isn't accurate

- **Visual Badges** - Tags display as colorful badges over game tiles in your Steam library

- **Universal Sync Progress** - Real-time progress tracking during library sync

- **Automated Build Workflow** - GitHub Actions for continuous artifact builds on every commit

- **Persistent Storage** - All tags and settings saved in local SQLite database

## Screenshots

![Game Progress Tracker Plugin UI](assets/plugin-screenshot.jpg)

The plugin interface showing tag sections with game counts - Completed (16), Mastered (2), and Dropped (20) games are visible with their respective colored badges.

## Installation

### Via URL (Recommended)

1. Open Decky Loader on your Steam Deck (QAM → Plugin icon)
2. Navigate to Settings → Developer Mode
3. Enable Developer Mode
4. Install from URL: `https://github.com/maroun2/game-progress-tracker/releases/download/1.3.0/game-progress-tracker-1.3.0.zip`
5. Restart Decky if prompted

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/maroun2/game-progress-tracker/releases)
2. Extract to: `~/homebrew/plugins/game-progress-tracker/`
3. Restart Decky Loader

## Usage

### Initial Setup

1. Open the plugin from Decky Loader (QAM → Plugin icon → Game Progress Tracker)
2. Click "Sync Entire Library" to analyze all your games
3. Wait for sync to complete (may take several minutes for large libraries)
4. Real-time progress shows "Syncing: X/Y games"

### Viewing Tags

- Navigate to any game in your Steam library
- Tags appear as colorful badges in the top-right corner of the game page
- Click a tag to open the Tag Manager for manual adjustments

### Managing Tags

The plugin organizes games into expandable sections:

1. Navigate with D-pad to any tag section (In Progress, Completed, Mastered, Dropped, Backlog)
2. Press A to expand/collapse the section
3. View all games in that category
4. Press A on any game to navigate to its library page
5. Games marked "manual" show a badge indicating manual override

### Settings

Access settings from the plugin menu:

- **Enable Auto-Tagging** - Toggle automatic tag assignment
- **Mastered Multiplier** - Adjust threshold for "Mastered" tag (default: 1.5x)
- **In Progress Threshold** - Minimum playtime to mark as "In Progress" (default: 30 minutes)
- **Game Sources** - Choose which games to sync (Installed, Non-Steam, All Owned)
- **Sync Library** - Manually trigger a full library sync

## Tag Logic

The plugin uses a priority-based system where higher priority tags override lower ones:

### 1. Mastered (Highest Priority)
- Requires: 85%+ of all achievements unlocked
- Shows true game mastery beyond basic completion
- Priority: Overrides all other tags

### 2. Completed
- Requires: Playtime ≥ HLTB main story completion time
- Indicates you've beaten the main story
- Priority: Overrides Dropped, In Progress, Backlog

### 3. Dropped
- Requires: Game not played for 365+ days
- Only applies if not Mastered or Completed
- Automatically detected by daily background task
- Priority: Overrides In Progress, Backlog

### 4. In Progress
- Requires: Playtime ≥ 30 minutes
- Currently playing or recently played
- Priority: Overrides Backlog only

### 5. Backlog (Lowest Priority)
- No significant playtime
- Not started yet
- Default tag for games not matching other criteria

**Example**: A game with 90% achievements and 1+ year since last play will be tagged as **Mastered** (not Dropped), because Mastered has higher priority.

## Development

### Prerequisites

- Node.js 18+
- npm
- Python 3.10+
- Steam Deck (for testing) or Decky Loader development environment

### Setup

```bash
# Clone the repository
git clone https://github.com/maroun2/game-progress-tracker.git
cd game-progress-tracker

# Install dependencies
npm install

# Build the plugin
npm run build
```

## Project Structure

```
game-progress-tracker/
├── backend/               # Python backend (in development)
├── src/                   # TypeScript frontend
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── index.tsx          # Plugin entry point
│   └── types.ts           # TypeScript type definitions
├── main.py                # Backend entry point
├── plugin.json            # Plugin metadata
├── package.json           # npm configuration
└── rollup.config.mjs      # Build configuration
```

## Technical Details

### Frontend Architecture
- Built with TypeScript and React
- Uses Decky Loader UI components (@decky/ui)
  - `ButtonItem` for focusable interactive elements
  - `PanelSectionRow` for proper layout structure
  - `PanelSection` for grouping
- Rollup for bundling
- Real-time state updates with smart UI refreshing (10s intervals)
- Full gamepad navigation with proper focus styling

### Backend Architecture
- Python asyncio for concurrent operations
- SQLite for local data storage
- HowLongToBeat API integration for game completion time data
- Steam API integration for achievement and playtime data
- Background tasks for daily dropped game detection
- Centralized tag calculation in `calculate_auto_tag()` function

### Communication
- Frontend-backend communication via `@decky/api` call() function
- All parameters passed as single dict to Python backend
- Real-time sync progress updates via polling

### Route Patching
- ProtonDB-style safe patching with `afterPatch` and `findInReactTree`
- Visual badges integrated into Steam library UI
- Uses `createReactTreePatcher` for reliable UI modifications

## Troubleshooting

### Tags not appearing

1. Ensure plugin is enabled in Decky settings
2. Run "Sync Library" from plugin settings
3. Check `/home/deck/homebrew/plugins/game-progress-tracker/logs/message.txt` for errors

### Incorrect tags

1. Open the plugin settings to view tag details
2. Verify achievement and playtime data is correct
3. Manually override if needed by using manual tag assignment
4. Tags follow priority order: Mastered > Completed > Dropped > In Progress > Backlog

### HLTB data not found

- Some games may not be in the HowLongToBeat database
- "Completed" tag will not be assigned without HLTB data
- Other tags (Mastered, In Progress, Dropped, Backlog) will still work

### Performance issues

- Large libraries (500+ games) may take time to sync
- Sync runs in background with real-time progress updates
- Sync shouldn't block UI interactions
- Consider adjusting game sources in settings

### Dropped tag not appearing

- Dropped tag only applies to games not played for 365+ days
- Does not apply to Mastered or Completed games (they have higher priority)
- Background task runs daily to detect dropped games
- Manual sync will also detect dropped games

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on Steam Deck if possible
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file

## Credits

- Built with [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader)
- Game completion data from [HowLongToBeat](https://howlongtobeat.com/)
- Python HLTB integration via [howlongtobeatpy](https://github.com/ScrappyCocco/HowLongToBeat-PythonAPI)

## Support

- **Issues:** [GitHub Issues](https://github.com/maroun2/game-progress-tracker/issues)
- **Discord:** [Decky Loader Discord](https://deckbrew.xyz/discord)
- **Documentation:** [Decky Wiki](https://wiki.deckbrew.xyz/)

## Changelog

### v1.3.0 (2026-02-17)
- **New:** Dropped tag system - automatic detection of games not played for 365+ days
- **New:** Full gamepad navigation with D-pad support for all UI elements
- **New:** Universal sync progress tracking with real-time updates ("Syncing: X/Y games")
- **New:** Automated build workflow via GitHub Actions (artifacts for every commit)
- **New:** Backlog tag for games not yet started
- **Improved:** Tag priority system (Mastered → Completed → Dropped → In Progress → Backlog)
- **Improved:** UI components now use native Decky UI framework (ButtonItem, PanelSectionRow, PanelSection)
- **Improved:** Better focus highlighting for Steam Deck navigation using native focus system
- **Improved:** Centralized tag calculation logic in `calculate_auto_tag()` function
- **Improved:** In Progress threshold reduced to 30 minutes (from 60 minutes)
- **Fixed:** Dropped tag being overwritten during sync
- **Fixed:** Dropped tag being lost when viewing game detail page
- **Fixed:** State management improvements for better reliability
- **Technical:** Removed custom focus styling to use Steam's native focus system
- **Technical:** Better separation of concerns and reduced code duplication

### v1.2.0
- Enhanced UI with proper Decky components
- Improved state management
- Bug fixes and performance improvements

### v1.1.0
- Added manual tag override system
- Improved HLTB integration
- UI refinements

### v1.0.0
- Initial release
- Automatic tagging system (Completed, In Progress, Mastered)
- HLTB integration
- Basic UI
