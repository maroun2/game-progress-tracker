# Game Progress Tracker

A Decky Loader plugin for Steam Deck that automatically tags your games based on completion status, playtime, and achievements.

## Features

- **Automatic Tagging System**
  - **Completed** - Games with all achievements unlocked
  - **In Progress** - Games played for at least 1 hour
  - **Mastered** - Games where playtime exceeds expected completion time

- **HowLongToBeat Integration** - Fetches game completion times to determine "Mastered" status

- **Manual Override** - Change any tag manually if automatic detection isn't accurate

- **Visual Badges** - Tags display as colorful badges over game tiles in your Steam library

- **Persistent Storage** - All tags and settings saved in local SQLite database

## Screenshots

*Coming soon*

## Installation

### Via Decky Plugin Store (Recommended)

1. Open Decky Loader on your Steam Deck (QAM → Plugin icon)
2. Navigate to the Plugin Store
3. Search for "Game Progress Tracker"
4. Click Install
5. Restart Decky if prompted

### Manual Installation

1. Download the latest release from GitHub
2. Extract to: `~/homebrew/plugins/game-progress-tracker/`
3. Restart Decky Loader

## Usage

### Initial Setup

1. Open the plugin from Decky Loader (QAM → Plugin icon → Game Progress Tracker)
2. Click "Sync Entire Library" to analyze all your games
3. Wait for sync to complete (may take several minutes for large libraries)

### Viewing Tags

- Navigate to any game in your Steam library
- Tags appear as colorful badges in the top-right corner of the game page
- Click a tag to open the Tag Manager for manual adjustments

### Managing Tags Manually

1. Click on a game's tag badge (or open Tag Manager)
2. View current statistics:
   - Playtime
   - Achievement progress
   - HowLongToBeat completion time
3. Click any tag button to manually set:
   - Completed
   - In Progress
   - Mastered
4. Click "Reset to Automatic" to return to auto-calculated tag

### Settings

Access settings from the plugin menu:

- **Enable Auto-Tagging** - Toggle automatic tag assignment
- **Mastered Multiplier** - Adjust threshold for "Mastered" tag (default: 1.5x)
- **In Progress Threshold** - Minimum playtime to mark as "In Progress" (default: 60 minutes)
- **Sync Library** - Manually trigger a full library sync
- **Refresh HLTB Cache** - Clear and rebuild HowLongToBeat data cache

## Tag Logic

### Completed
- Requires: 100% of achievements unlocked
- Priority: Highest (overrides other tags)
- Note: Games with 0 achievements cannot be marked "Completed"

### Mastered
- Requires: Playtime > (HLTB completion time × multiplier)
- Default multiplier: 1.5x
- Example: Game takes 40 hours to complete → "Mastered" at 60+ hours
- Priority: Medium (if not completed)

### In Progress
- Requires: Playtime ≥ threshold (default: 60 minutes)
- Priority: Lowest (if not completed or mastered)

## Development

### Prerequisites

- Node.js v16.14+
- pnpm v9
- Python 3.10+
- Steam Deck (for testing) or Decky Loader development environment

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/game-progress-tracker.git
cd game-progress-tracker

# Install dependencies
pnpm install
pip install -r requirements.txt

# Build the plugin
pnpm run build
```

### Development Workflow

See [PLAN.md](PLAN.md) for detailed development plan.

```bash
# Watch mode for automatic rebuilds
pnpm run watch

# Deploy to Steam Deck (configure VSCode settings first)
# Use VSCode task: "builddeploy"

# Run tests
pytest tests/
```

### Testing

See [TEST_PLAN.md](TEST_PLAN.md) for comprehensive testing strategy.

```bash
# Run unit tests
pytest tests/unit

# Run integration tests
pytest tests/integration

# Run with coverage
pytest --cov=backend --cov-report=html
```

## Project Structure

```
game-progress-tracker/
├── backend/src/          # Python backend
│   ├── database.py       # SQLite management
│   ├── steam_data.py     # Steam API/VDF parsing
│   └── hltb_service.py   # HowLongToBeat integration
├── src/                  # TypeScript frontend
│   ├── index.tsx         # Plugin entry point
│   ├── components/       # React components
│   └── hooks/            # Custom React hooks
├── tests/                # Test suites
├── main.py               # Backend entry point
├── plugin.json           # Plugin metadata
└── package.json          # npm configuration
```

## Troubleshooting

### Tags not appearing

1. Ensure plugin is enabled in Decky settings
2. Run "Sync Library" from plugin settings
3. Check `/tmp/decky/plugin.log` for errors

### Incorrect tags

1. Open Tag Manager for the game
2. Verify achievement and playtime data is correct
3. Manually override if needed
4. Report issue if data from Steam is wrong

### HLTB data not found

- Some games may not be in the HowLongToBeat database
- "Mastered" tag will not be assigned without HLTB data
- Other tags (Completed, In Progress) will still work

### Performance issues

- Large libraries (500+ games) may take time to sync
- Sync runs in background and shouldn't block UI
- Consider increasing cache TTL in settings

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file

## Credits

- Built with [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader)
- Game completion data from [HowLongToBeat](https://howlongtobeat.com/)
- Python HLTB integration via [howlongtobeatpy](https://github.com/ScrappyCocco/HowLongToBeat-PythonAPI)

## Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/game-progress-tracker/issues)
- **Discord:** [Decky Loader Discord](https://deckbrew.xyz/discord)
- **Documentation:** [Decky Wiki](https://wiki.deckbrew.xyz/)

## Roadmap

- [ ] Statistics dashboard with charts
- [ ] Custom tag colors
- [ ] Library filtering by tag
- [ ] Export tag data
- [ ] Integration with other game tracking services
- [ ] Tag sharing/import feature

## Changelog

### v1.0.0 (TBD)
- Initial release
- Automatic tagging based on achievements, playtime, and HLTB data
- Manual tag override system
- Visual badges in library
- Settings configuration
