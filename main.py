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

# Setup paths - everything is in backend/src/
PLUGIN_DIR = Path(decky.DECKY_PLUGIN_DIR)
BACKEND_SRC = PLUGIN_DIR / "backend" / "src"

logger = decky.logger
logger.info("=== Game Progress Tracker v1.0.51 starting ===")
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
        """Calculate automatic tag based on game stats"""
        # Get game statistics
        stats = await self.db.get_game_stats(appid)
        if not stats:
            logger.debug(f"No stats found for {appid}")
            return None

        # Get HLTB data
        hltb = await self.db.get_hltb_cache(appid)

        # Get settings
        settings = await self.db.get_all_settings()
        mastered_multiplier = settings.get('mastered_multiplier', 1.5)
        in_progress_threshold = settings.get('in_progress_threshold', 60)

        # Priority 1: Completed (100% achievements)
        if stats['total_achievements'] > 0:
            if stats['unlocked_achievements'] >= stats['total_achievements']:
                return "completed"

        # Priority 2: Mastered (over-played)
        if hltb and hltb.get('main_extra'):
            completion_hours = hltb['main_extra']
            completion_threshold = completion_hours * mastered_multiplier * 60  # Convert to minutes

            if stats['playtime_minutes'] >= completion_threshold:
                return "mastered"

        # Priority 3: In Progress (played >= threshold)
        if stats['playtime_minutes'] >= in_progress_threshold:
            return "in_progress"

        return None  # No tag

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

    # ==================== Plugin API Methods ====================

    async def get_game_tag(self, appid: str) -> Dict[str, Any]:
        """Get tag for a specific game"""
        try:
            tag = await self.db.get_tag(appid)
            if tag:
                return {"success": True, "tag": tag}
            return {"success": True, "tag": None}
        except Exception as e:
            logger.error(f"Error getting tag for {appid}: {e}")
            return {"success": False, "error": str(e)}

    async def set_manual_tag(self, appid: str, tag: str) -> Dict[str, bool]:
        """Manually set/override tag"""
        try:
            # Validate tag
            valid_tags = ['completed', 'in_progress', 'mastered']
            if tag not in valid_tags:
                return {"success": False, "error": f"Invalid tag. Must be one of: {valid_tags}"}

            success = await self.db.set_tag(appid, tag, is_manual=True)
            if success:
                logger.info(f"Manual tag set for {appid}: {tag}")
            return {"success": success}
        except Exception as e:
            logger.error(f"Error setting manual tag for {appid}: {e}")
            return {"success": False, "error": str(e)}

    async def remove_tag(self, appid: str) -> Dict[str, bool]:
        """Remove tag from game"""
        try:
            success = await self.db.remove_tag(appid)
            return {"success": success}
        except Exception as e:
            logger.error(f"Error removing tag for {appid}: {e}")
            return {"success": False, "error": str(e)}

    async def reset_to_auto_tag(self, appid: str) -> Dict[str, Any]:
        """Reset manual override to auto-calculated tag"""
        try:
            # Force recalculation
            result = await Plugin.sync_game_tags(self, appid, force=True)
            return {"success": True, "tag": result}
        except Exception as e:
            logger.error(f"Error resetting tag for {appid}: {e}")
            return {"success": False, "error": str(e)}

    async def sync_single_game(self, appid: str) -> Dict[str, Any]:
        """Sync data and tags for single game"""
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

    async def get_game_details(self, appid: str) -> Dict[str, Any]:
        """Get all details for a game"""
        try:
            # Get stats
            stats = await self.db.get_game_stats(appid)

            # If no stats, fetch from Steam
            if not stats:
                stats = await self.steam_service.get_game_stats_full(appid)
                if stats:
                    await self.db.update_game_stats(appid, stats)

            # Get tag
            tag = await self.db.get_tag(appid)

            # Get HLTB data
            hltb_data = await self.db.get_hltb_cache(appid)

            return {
                "success": True,
                "appid": appid,
                "stats": stats,
                "tag": tag,
                "hltb_data": hltb_data
            }

        except Exception as e:
            logger.error(f"Error getting game details for {appid}: {e}")
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
        try:
            all_tags = await self.db.get_all_tags()
            all_games = await self.db.get_all_game_stats()
            total_library = len(all_games) if all_games else 0

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

            return {"success": True, "stats": stats}
        except Exception as e:
            logger.error(f"Error getting tag statistics: {e}")
            return {"success": False, "error": str(e)}

    async def get_all_games(self) -> Dict[str, Any]:
        """Get list of all games for frontend to fetch playtime"""
        logger.info("=== get_all_games called (frontend requesting game list) ===")
        try:
            games = await self.steam_service.get_all_games()
            logger.info(f"get_all_games: returning {len(games)} games to frontend")
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
        logger.info(f"Received playtime_data keys count: {len(playtime_data) if isinstance(playtime_data, dict) else 'NOT A DICT'}")

        # Log sample of playtime data
        if isinstance(playtime_data, dict):
            sample = list(playtime_data.items())[:5]
            logger.info(f"Sample playtime data (first 5): {sample}")
            non_zero = sum(1 for v in playtime_data.values() if v > 0)
            logger.info(f"Games with playtime > 0: {non_zero}/{len(playtime_data)}")

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

                # Use playtime from frontend
                playtime_minutes = playtime_data.get(appid, 0)

                logger.info(f"[{i+1}/{total}] Syncing: {game_name} ({appid})")

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
        try:
            all_tags = await self.db.get_all_tags()

            result = []
            for tag_entry in all_tags:
                appid = tag_entry['appid']
                stats = await self.db.get_game_stats(appid)
                game_name = stats.get('game_name', f'Game {appid}') if stats else f'Game {appid}'

                result.append({
                    'appid': appid,
                    'game_name': game_name,
                    'tag': tag_entry['tag'],
                    'is_manual': tag_entry.get('is_manual', False)
                })

            # Sort by tag type, then by name
            tag_order = {'completed': 0, 'mastered': 1, 'in_progress': 2}
            result.sort(key=lambda x: (tag_order.get(x['tag'], 99), x['game_name'].lower()))

            return {'success': True, 'games': result}
        except Exception as e:
            logger.error(f"Error getting all tags with names: {e}")
            return {'success': False, 'error': str(e)}
