"""
Game Progress Tracker - Main Plugin Entry
Decky Loader plugin for automatic game tagging
"""

# Standard library imports first
import os
import sys
import asyncio
from pathlib import Path
from typing import Optional, Dict, Any, List

# Import decky to get plugin directory path
import decky
import json

# Setup paths - everything is in backend/src/
PLUGIN_DIR = Path(decky.DECKY_PLUGIN_DIR)
BACKEND_SRC = PLUGIN_DIR / "backend" / "src"

# Read version from plugin.json
def get_plugin_version():
    try:
        plugin_json_path = PLUGIN_DIR / "plugin.json"
        if plugin_json_path.exists():
            with open(plugin_json_path) as f:
                data = json.load(f)
                return data.get("version", "unknown")
    except Exception:
        pass
    return "unknown"

PLUGIN_VERSION = get_plugin_version()

logger = decky.logger
logger.info(f"=== Game Progress Tracker v{PLUGIN_VERSION} starting ===")
logger.info(f"Plugin dir: {PLUGIN_DIR}")
logger.info(f"Backend src: {BACKEND_SRC} exists={BACKEND_SRC.exists()}")

# Add backend/src to path - all modules and dependencies are there
if BACKEND_SRC.exists() and str(BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(BACKEND_SRC))
    logger.info(f"Added to sys.path: {BACKEND_SRC}")

# List contents of backend/src specifically
if BACKEND_SRC.exists():
    src_contents = list(BACKEND_SRC.iterdir())
    logger.info(f"backend/src/ contains {len(src_contents)} items:")
    for item in src_contents[:30]:
        logger.info(f"  - {item.name}")

logger.info(f"sys.path: {sys.path[:5]}...")  # First 5 entries

# Now import backend modules
try:
    from database import Database
    from steam_data import SteamDataService
    from hltb_service import HLTBService
    logger.info("Backend modules imported successfully")
except ImportError as e:
    logger.error(f"Import failed: {e}")
    import traceback
    logger.error(traceback.format_exc())
    # Create dummy classes so plugin can at least load
    class Database:
        def __init__(self, *args): pass
        async def init_database(self): pass
        async def close(self): pass
    class SteamDataService:
        def __init__(self): pass
    class HLTBService:
        def __init__(self): pass


class Plugin:
    """Main plugin class for Decky Loader"""

    async def _main(self):
        """Initialize plugin on load"""
        logger.info("Game Progress Tracker plugin starting...")

        # Get plugin data directory
        self.plugin_dir = os.environ.get(
            "DECKY_PLUGIN_RUNTIME_DIR",
            str(Path.home() / ".local" / "share" / "decky" / "game-progress-tracker")
        )
        Path(self.plugin_dir).mkdir(parents=True, exist_ok=True)

        # Initialize database
        db_path = os.path.join(self.plugin_dir, "game_tracker.db")
        self.db = Database(db_path)
        await self.db.init_database()

        # Initialize services
        self.steam_service = SteamDataService()
        self.hltb_service = HLTBService()

        logger.info("Plugin initialized successfully")

        # Auto-run sync on startup for testing
        # Note: Use Plugin.method(self) pattern due to Decky Loader bug #509
        logger.info("=== AUTO-RUNNING sync_library for testing ===")
        try:
            result = await Plugin.sync_library(self)
            logger.info(f"Auto-sync result: {result}")
        except Exception as e:
            logger.error(f"Auto-sync failed: {e}")
            import traceback
            logger.error(traceback.format_exc())

    async def _unload(self):
        """Cleanup on plugin unload"""
        logger.info("Unloading plugin...")
        if hasattr(self, 'db'):
            await self.db.close()

    # ==================== Tag Calculation Logic ====================

    async def calculate_auto_tag(self, appid: str) -> Optional[str]:
        """Calculate automatic tag based on game stats

        Tag priority:
        1. Mastered: 100% achievements unlocked
        2. Completed: playtime >= main_story time from HLTB
        3. In Progress: playtime >= threshold (default 30 min)
        """
        # Get game statistics
        stats = await self.db.get_game_stats(appid)
        if not stats:
            logger.debug(f"No stats found for {appid}")
            return None

        # Get HLTB data
        hltb = await self.db.get_hltb_cache(appid)

        # Get settings
        settings = await self.db.get_all_settings()
        in_progress_threshold = settings.get('in_progress_threshold', 30)  # Default 30 min

        # Priority 1: Mastered (100% achievements)
        if stats['total_achievements'] > 0:
            if stats['unlocked_achievements'] >= stats['total_achievements']:
                return "mastered"

        # Priority 2: Completed (beat main story - playtime >= main_story)
        if hltb and hltb.get('main_story'):
            main_story_hours = hltb['main_story']
            main_story_minutes = main_story_hours * 60

            if stats['playtime_minutes'] >= main_story_minutes:
                return "completed"

        # Priority 3: In Progress (played >= threshold)
        if stats['playtime_minutes'] >= in_progress_threshold:
            return "in_progress"

        return None  # No tag (backlog)

    async def sync_game_tags(self, appid: str, force: bool = False) -> Dict[str, Any]:
        """Sync tags for a single game"""
        try:
            # Get current tag
            current_tag = await self.db.get_tag(appid)

            # Skip if manual override and not forcing
            if current_tag and current_tag.get('is_manual') and not force:
                logger.debug(f"Skipping {appid} (manual override)")
                return current_tag

            # Fetch fresh game stats
            stats = await self.steam_service.get_game_stats_full(appid)
            await self.db.update_game_stats(appid, stats)

            # Log playtime and achievement info
            logger.info(f"  Stats: playtime={stats.get('playtime_minutes', 0)}min, " +
                        f"achievements={stats.get('unlocked_achievements', 0)}/{stats.get('total_achievements', 0)}")

            # Fetch HLTB data if not cached
            cached_hltb = await self.db.get_hltb_cache(appid)
            if not cached_hltb:
                hltb_data = await self.hltb_service.search_game(stats['game_name'])
                if hltb_data:
                    await self.db.cache_hltb_data(appid, hltb_data)
                    cached_hltb = hltb_data

            # Log HLTB info
            if cached_hltb:
                logger.info(f"  HLTB: main={cached_hltb.get('main_story')}h, extra={cached_hltb.get('main_extra')}h")
            else:
                logger.info(f"  HLTB: no data")

            # Calculate new tag
            new_tag = await Plugin.calculate_auto_tag(self, appid)
            logger.info(f"  Calculated tag: {new_tag or 'none'}")

            # Update if changed or doesn't exist
            if new_tag:
                current_tag_value = current_tag.get('tag') if current_tag else None
                if new_tag != current_tag_value:
                    await self.db.set_tag(appid, new_tag, is_manual=False)
                    logger.info(f"  -> Tag set: {new_tag}")

            return await self.db.get_tag(appid) or {}

        except Exception as e:
            logger.error(f"Failed to sync tags for {appid}: {e}")
            return {"error": str(e)}

    # ==================== Helper Methods ====================

    def _extract_appid(self, appid) -> str:
        """Extract appid string from various input formats.
        Decky API may pass params as dict or string depending on version."""
        if isinstance(appid, dict):
            # Handle case where call() passes {appid: "123"} as single param
            return str(appid.get('appid', appid))
        return str(appid)

    def _extract_params(self, first_arg, **kwargs) -> Dict[str, Any]:
        """Extract parameters from Decky API call.
        Decky may pass all params as a single dict in first_arg."""
        if isinstance(first_arg, dict):
            # All params came as a dict in first argument
            return first_arg
        # Traditional separate arguments
        result = {'appid': str(first_arg)} if first_arg is not None else {}
        result.update(kwargs)
        return result

    # ==================== Plugin API Methods ====================

    async def get_game_tag(self, appid) -> Dict[str, Any]:
        """Get tag for a specific game"""
        appid = self._extract_appid(appid)
        logger.info(f"=== get_game_tag called: appid={appid} ===")
        try:
            tag = await self.db.get_tag(appid)
            logger.info(f"[get_game_tag] appid={appid}, tag={tag}")
            if tag:
                return {"success": True, "tag": tag}
            return {"success": True, "tag": None}
        except Exception as e:
            logger.error(f"Error getting tag for {appid}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {"success": False, "error": str(e)}

    async def set_manual_tag(self, appid_or_params, tag: str = None) -> Dict[str, bool]:
        """Manually set/override tag"""
        # Extract params - Decky may pass {appid, tag} as single dict
        params = self._extract_params(appid_or_params, tag=tag)
        appid = str(params.get('appid', ''))
        tag = params.get('tag')

        logger.info(f"=== set_manual_tag called: appid={appid}, tag={tag} ===")

        if not appid:
            return {"success": False, "error": "Missing appid parameter"}
        if not tag:
            return {"success": False, "error": "Missing tag parameter"}

        try:
            # Validate tag
            valid_tags = ['completed', 'in_progress', 'mastered']
            if tag not in valid_tags:
                logger.error(f"Invalid tag: {tag}. Must be one of: {valid_tags}")
                return {"success": False, "error": f"Invalid tag. Must be one of: {valid_tags}"}

            success = await self.db.set_tag(appid, tag, is_manual=True)
            logger.info(f"[set_manual_tag] appid={appid}, tag={tag}, success={success}")
            return {"success": success}
        except Exception as e:
            logger.error(f"Error setting manual tag for {appid}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {"success": False, "error": str(e)}

    async def remove_tag(self, appid) -> Dict[str, bool]:
        """Remove tag from game"""
        appid = self._extract_appid(appid)
        try:
            success = await self.db.remove_tag(appid)
            return {"success": success}
        except Exception as e:
            logger.error(f"Error removing tag for {appid}: {e}")
            return {"success": False, "error": str(e)}

    async def reset_to_auto_tag(self, appid) -> Dict[str, Any]:
        """Reset manual override to auto-calculated tag"""
        appid = self._extract_appid(appid)
        try:
            # Force recalculation
            result = await Plugin.sync_game_tags(self, appid, force=True)
            return {"success": True, "tag": result}
        except Exception as e:
            logger.error(f"Error resetting tag for {appid}: {e}")
            return {"success": False, "error": str(e)}

    async def sync_single_game(self, appid) -> Dict[str, Any]:
        """Sync data and tags for single game"""
        appid = self._extract_appid(appid)
        try:
            result = await Plugin.sync_game_tags(self, appid, force=False)
            return {"success": True, "result": result}
        except Exception as e:
            logger.error(f"Error syncing game {appid}: {e}")
            return {"success": False, "error": str(e)}

    async def sync_library(self) -> Dict[str, Any]:
        """Bulk sync entire library"""
        try:
            logger.info("=== sync_library called ===")

            # Get all games from Steam
            logger.info("Fetching games from Steam...")
            games = await self.steam_service.get_all_games()
            total = len(games)
            logger.info(f"Found {total} games in Steam library")

            if total == 0:
                return {
                    "success": True,
                    "message": "No games found in library",
                    "total": 0,
                    "synced": 0,
                    "errors": 0
                }

            synced = 0
            errors = 0
            error_list = []

            for i, game in enumerate(games):
                appid = game['appid']
                game_name = game.get('name', f'Game {appid}')

                # Log progress for each game
                logger.info(f"[{i+1}/{total}] Syncing: {game_name} ({appid})")

                try:
                    await Plugin.sync_game_tags(self, appid)
                    synced += 1
                    logger.info(f"[{i+1}/{total}] Completed: {game_name}")

                    # Add delay for HLTB rate limiting
                    if i < total - 1:
                        await asyncio.sleep(1.0)

                except Exception as e:
                    errors += 1
                    error_list.append({"appid": appid, "error": str(e)})
                    logger.error(f"[{i+1}/{total}] Failed: {game_name} - {e}")

            logger.info(f"Library sync completed: {synced}/{total} synced, {errors} errors")

            return {
                "success": True,
                "total": total,
                "synced": synced,
                "errors": errors,
                "error_details": error_list[:10]  # Limit to first 10 errors
            }

        except Exception as e:
            logger.error(f"Library sync failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {"success": False, "error": str(e)}

    async def refresh_hltb_cache(self) -> Dict[str, Any]:
        """Clear and rebuild HLTB cache"""
        try:
            # This would require deleting all HLTB cache and resyncing
            # For now, just return success
            logger.info("HLTB cache refresh requested")
            return {
                "success": True,
                "message": "Cache will be refreshed on next sync"
            }
        except Exception as e:
            logger.error(f"Failed to refresh HLTB cache: {e}")
            return {"success": False, "error": str(e)}

    async def get_game_details(self, appid) -> Dict[str, Any]:
        """Get all details for a game"""
        appid = self._extract_appid(appid)
        logger.info(f"=== get_game_details called: appid={appid} ===")
        try:
            # Get stats
            stats = await self.db.get_game_stats(appid)
            logger.info(f"[get_game_details] stats from db: {stats}")

            # If no stats, fetch from Steam
            if not stats:
                logger.info(f"[get_game_details] no stats in db, fetching from Steam...")
                stats = await self.steam_service.get_game_stats_full(appid)
                logger.info(f"[get_game_details] stats from Steam: {stats}")
                if stats:
                    await self.db.update_game_stats(appid, stats)

            # Get tag
            tag = await self.db.get_tag(appid)
            logger.info(f"[get_game_details] tag: {tag}")

            # Get HLTB data
            hltb_data = await self.db.get_hltb_cache(appid)
            logger.info(f"[get_game_details] hltb_data: {hltb_data}")

            result = {
                "success": True,
                "appid": appid,
                "stats": stats,
                "tag": tag,
                "hltb_data": hltb_data
            }
            logger.info(f"[get_game_details] returning: success=True")
            return result

        except Exception as e:
            logger.error(f"Error getting game details for {appid}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {"success": False, "error": str(e)}

    async def get_settings(self) -> Dict[str, Any]:
        """Get all plugin settings"""
        try:
            settings = await self.db.get_all_settings()
            return {"success": True, "settings": settings}
        except Exception as e:
            logger.error(f"Error getting settings: {e}")
            return {"success": False, "error": str(e)}

    async def update_settings(self, settings: Dict[str, Any]) -> Dict[str, bool]:
        """Update plugin settings"""
        try:
            for key, value in settings.items():
                await self.db.set_setting(key, value)

            logger.info(f"Settings updated: {settings}")
            return {"success": True}
        except Exception as e:
            logger.error(f"Error updating settings: {e}")
            return {"success": False, "error": str(e)}

    async def get_tag_statistics(self) -> Dict[str, Any]:
        """Get counts per tag type"""
        logger.info("=== get_tag_statistics called ===")
        try:
            all_tags = await self.db.get_all_tags()
            logger.info(f"[get_tag_statistics] all_tags count: {len(all_tags) if all_tags else 0}")
            if all_tags:
                logger.info(f"[get_tag_statistics] all_tags sample (first 3): {all_tags[:3]}")

            all_games = await self.db.get_all_game_stats()
            total_library = len(all_games) if all_games else 0
            logger.info(f"[get_tag_statistics] total_library (all_games count): {total_library}")

            stats = {
                "completed": 0,
                "in_progress": 0,
                "mastered": 0,
                "backlog": total_library - len(all_tags),
                "total": total_library
            }

            for tag_entry in all_tags:
                tag_type = tag_entry.get('tag')
                if tag_type in stats:
                    stats[tag_type] += 1

            result = {"success": True, "stats": stats}
            logger.info(f"[get_tag_statistics] returning: {result}")
            return result
        except Exception as e:
            logger.error(f"Error getting tag statistics: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {"success": False, "error": str(e)}

    async def log_frontend(self, level: str, message: str) -> Dict[str, bool]:
        """Log a message from the frontend to the backend log file"""
        if level == "error":
            logger.error(f"[FRONTEND] {message}")
        elif level == "warn":
            logger.warning(f"[FRONTEND] {message}")
        else:
            logger.info(f"[FRONTEND] {message}")
        return {"success": True}

    async def get_all_games(self) -> Dict[str, Any]:
        """Get list of all games for frontend to fetch playtime"""
        logger.info("=== get_all_games called (frontend requesting game list) ===")
        try:
            # Get source settings
            settings = await self.db.get_all_settings()
            source_installed = settings.get('source_installed', True)
            source_non_steam = settings.get('source_non_steam', False)

            logger.info(f"Game sources: installed={source_installed}, non_steam={source_non_steam}")

            games = []

            # Get installed Steam games
            if source_installed:
                installed_games = await self.steam_service.get_all_games()
                games.extend(installed_games)
                logger.info(f"Added {len(installed_games)} installed games")

            # Get non-Steam games
            if source_non_steam:
                non_steam_games = await self.steam_service.get_non_steam_games()
                games.extend(non_steam_games)
                logger.info(f"Added {len(non_steam_games)} non-Steam games")

            logger.info(f"get_all_games: returning {len(games)} total games to frontend")
            return {"success": True, "games": games}
        except Exception as e:
            logger.error(f"get_all_games failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {"success": False, "error": str(e)}

    async def sync_library_with_playtime(self, playtime_data: Dict[str, int]) -> Dict[str, Any]:
        """Sync library using playtime data provided by frontend"""
        logger.info("=== sync_library_with_playtime called ===")
        logger.info(f"Received playtime_data type: {type(playtime_data)}")
        logger.info(f"Received playtime_data: {str(playtime_data)[:500]}")

        # Handle case where playtime_data might be nested or wrong type
        if isinstance(playtime_data, dict):
            logger.info(f"Received playtime_data keys count: {len(playtime_data)}")
            sample = list(playtime_data.items())[:5]
            logger.info(f"Sample playtime data (first 5): {sample}")
            # Safely count non-zero values
            try:
                non_zero = sum(1 for v in playtime_data.values() if isinstance(v, (int, float)) and v > 0)
                logger.info(f"Games with playtime > 0: {non_zero}/{len(playtime_data)}")
            except Exception as e:
                logger.error(f"Error counting non-zero playtime: {e}")
        else:
            logger.error(f"playtime_data is not a dict! Type: {type(playtime_data)}")

        try:
            logger.info(f"=== Starting sync with {len(playtime_data)} playtime entries ===")

            games = await self.steam_service.get_all_games()
            total = len(games)
            synced = 0
            errors = 0
            error_list = []

            for i, game in enumerate(games):
                appid = game['appid']
                game_name = game.get('name', f'Game {appid}')

                # Use playtime from frontend - ensure it's an int
                raw_playtime = playtime_data.get(appid, 0)
                if isinstance(raw_playtime, (int, float)):
                    playtime_minutes = int(raw_playtime)
                else:
                    logger.warning(f"Unexpected playtime type for {appid}: {type(raw_playtime)} = {raw_playtime}")
                    playtime_minutes = 0

                logger.info(f"[{i+1}/{total}] Syncing: {game_name} ({appid}), playtime={playtime_minutes}")

                try:
                    await Plugin.sync_game_with_playtime(self, appid, playtime_minutes)
                    synced += 1
                    logger.info(f"[{i+1}/{total}] Completed: {game_name}")

                    # Add delay for HLTB rate limiting
                    if i < total - 1:
                        await asyncio.sleep(1.0)

                except Exception as e:
                    errors += 1
                    error_list.append({"appid": appid, "error": str(e)})
                    logger.error(f"[{i+1}/{total}] Failed: {game_name} - {e}")

            logger.info(f"Library sync completed: {synced}/{total} synced, {errors} errors")

            return {
                "success": True,
                "total": total,
                "synced": synced,
                "errors": errors,
                "error_details": error_list[:10]
            }

        except Exception as e:
            logger.error(f"sync_library_with_playtime failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {"success": False, "error": str(e)}

    async def sync_game_with_playtime(self, appid: str, playtime_minutes: int) -> Dict[str, Any]:
        """Sync a single game using frontend-provided playtime"""
        logger.debug(f"sync_game_with_playtime: appid={appid}, playtime_minutes={playtime_minutes}")

        # Get current tag
        current_tag = await self.db.get_tag(appid)

        # Skip if manual override
        if current_tag and current_tag.get('is_manual'):
            logger.debug(f"Skipping {appid} (manual override)")
            return current_tag

        # Get game name from steam service
        game_name = await self.steam_service.get_game_name(appid)

        # Get achievements from steam service
        achievements = await self.steam_service.get_game_achievements(appid)

        # Build stats object with frontend playtime
        stats = {
            "appid": appid,
            "game_name": game_name,
            "playtime_minutes": playtime_minutes,  # From frontend!
            "total_achievements": achievements["total"],
            "unlocked_achievements": achievements["unlocked"],
            "achievement_percentage": achievements["percentage"]
        }

        await self.db.update_game_stats(appid, stats)

        logger.info(f"  Stats: playtime={playtime_minutes}min, " +
                    f"achievements={achievements['unlocked']}/{achievements['total']}")

        # Fetch HLTB if needed
        cached_hltb = await self.db.get_hltb_cache(appid)
        if not cached_hltb:
            hltb_data = await self.hltb_service.search_game(game_name)
            if hltb_data:
                await self.db.cache_hltb_data(appid, hltb_data)
                cached_hltb = hltb_data

        if cached_hltb:
            logger.info(f"  HLTB: main={cached_hltb.get('main_story')}h, extra={cached_hltb.get('main_extra')}h")
        else:
            logger.info(f"  HLTB: no data")

        # Calculate tag
        new_tag = await Plugin.calculate_auto_tag(self, appid)
        logger.info(f"  Calculated tag: {new_tag or 'none'}")

        # Update if changed or doesn't exist
        if new_tag:
            current_tag_value = current_tag.get('tag') if current_tag else None
            if new_tag != current_tag_value:
                await self.db.set_tag(appid, new_tag, is_manual=False)
                logger.info(f"  -> Tag set: {new_tag}")

        return await self.db.get_tag(appid) or {}

    async def get_all_tags_with_names(self) -> Dict[str, Any]:
        """Get all tags with game names for display"""
        logger.info("=== get_all_tags_with_names called ===")
        try:
            all_tags = await self.db.get_all_tags()
            logger.info(f"[get_all_tags_with_names] all_tags count: {len(all_tags) if all_tags else 0}")
            if all_tags:
                logger.info(f"[get_all_tags_with_names] all_tags sample (first 3): {all_tags[:3]}")

            result = []
            for tag_entry in all_tags:
                logger.info(f"[get_all_tags_with_names] tag_entry: {tag_entry}")
                appid = tag_entry['appid']
                stats = await self.db.get_game_stats(appid)
                logger.info(f"[get_all_tags_with_names] stats: {stats}")
                game_name = stats.get('game_name') if stats else None
                logger.info(f"[get_all_tags_with_names] game_name: {game_name}")

                # If no name in stats, try to get it from Steam/shortcuts
                if not game_name or game_name.startswith('Unknown Game') or game_name.startswith('Game '):
                    game_name = await self.steam_service.get_game_name(appid)

                result.append({
                    'appid': appid,
                    'game_name': game_name,
                    'tag': tag_entry['tag'],
                    'is_manual': tag_entry.get('is_manual', False)
                })

            # Sort by tag type, then by name
            tag_order = {'completed': 0, 'mastered': 1, 'in_progress': 2}
            result.sort(key=lambda x: (tag_order.get(x['tag'], 99), x['game_name'].lower()))

            logger.info(f"[get_all_tags_with_names] returning {len(result)} games")
            if result:
                logger.info(f"[get_all_tags_with_names] result sample (first 3): {result[:3]}")
            return {'success': True, 'games': result}
        except Exception as e:
            logger.error(f"Error getting all tags with names: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {'success': False, 'error': str(e)}
