"""
Steam Data Service
Parses Steam VDF files to extract game information, playtime, and achievements
Uses only standard library - no external vdf package
"""

import os
import re
from pathlib import Path
from typing import Optional, Dict, Any, List

# Use Decky's built-in logger
import decky
logger = decky.logger


def parse_vdf(content: str) -> Dict[str, Any]:
    """
    Simple VDF parser using only standard library.
    VDF format is similar to JSON but with different syntax.
    """
    result = {}
    stack = [result]
    current_key = None

    # Tokenize - handle quoted strings and bare words
    token_pattern = re.compile(r'"([^"\\]*(?:\\.[^"\\]*)*)"|(\{)|(\})|(\S+)')

    for match in token_pattern.finditer(content):
        quoted, open_brace, close_brace, bare = match.groups()

        token = quoted if quoted is not None else bare

        if open_brace:
            # Start new dict
            new_dict = {}
            if current_key is not None:
                stack[-1][current_key] = new_dict
                stack.append(new_dict)
                current_key = None
        elif close_brace:
            # End current dict
            if len(stack) > 1:
                stack.pop()
        elif token is not None:
            if current_key is None:
                current_key = token
            else:
                stack[-1][current_key] = token
                current_key = None

    return result


def load_vdf_file(filepath: Path) -> Dict[str, Any]:
    """Load and parse a VDF file"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        return parse_vdf(content)
    except Exception as e:
        logger.error(f"Failed to parse VDF file {filepath}: {e}")
        return {}


class SteamDataService:
    def __init__(self):
        self.steam_path = self._find_steam_path()
        self.user_id = None

    def _find_steam_path(self) -> Optional[Path]:
        """Find Steam installation path"""
        possible_paths = [
            Path.home() / ".steam" / "steam",
            Path.home() / ".local" / "share" / "Steam",
            Path("/home/deck/.steam/steam"),  # Steam Deck default
        ]

        for path in possible_paths:
            if path.exists():
                logger.info(f"Found Steam path: {path}")
                return path

        logger.warning("Steam path not found")
        return None

    async def get_steam_user_id(self) -> Optional[str]:
        """Get the current Steam user ID from localconfig.vdf"""
        if self.user_id:
            return self.user_id

        if not self.steam_path:
            return None

        userdata_path = self.steam_path / "userdata"
        if not userdata_path.exists():
            logger.warning("Steam userdata directory not found")
            return None

        # Find the most recently used user directory
        user_dirs = [d for d in userdata_path.iterdir() if d.is_dir() and d.name.isdigit()]

        if not user_dirs:
            logger.warning("No Steam user directories found")
            return None

        # Use the first user directory (or most recently modified)
        user_dirs.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        self.user_id = user_dirs[0].name
        logger.info(f"Using Steam user ID: {self.user_id}")
        return self.user_id

    async def get_game_playtime(self, appid: str) -> int:
        """Get playtime in minutes from localconfig.vdf or config.vdf"""
        user_id = await self.get_steam_user_id()
        if not user_id or not self.steam_path:
            return 0

        # Try multiple config file locations
        config_paths = [
            self.steam_path / "userdata" / user_id / "config" / "localconfig.vdf",
            self.steam_path / "userdata" / user_id / "localconfig.vdf",
        ]

        for config_path in config_paths:
            if config_path.exists():
                logger.debug(f"Found config at: {config_path}")
                playtime = await self._extract_playtime_from_config(config_path, appid)
                if playtime > 0:
                    return playtime

        return 0

    async def _extract_playtime_from_config(self, config_path: Path, appid: str) -> int:
        """Extract playtime from a config file"""
        try:
            data = load_vdf_file(config_path)

            # Log top-level keys for debugging
            top_keys = list(data.keys())
            logger.debug(f"Config top-level keys: {top_keys}")

            # Navigate through possible structures
            user_config = data.get("UserLocalConfigStore", data.get("UserRoamingConfigStore", {}))

            if not user_config:
                logger.debug("No UserLocalConfigStore or UserRoamingConfigStore found")
                return 0

            software = user_config.get("Software", user_config.get("software", {}))
            valve = software.get("Valve", software.get("valve", {}))
            steam = valve.get("Steam", valve.get("steam", {}))

            # Try both 'apps' and 'Apps'
            apps = steam.get("apps", steam.get("Apps", {}))

            if not apps:
                logger.debug(f"No apps section found. Steam keys: {list(steam.keys())[:5]}")
                return 0

            if appid in apps:
                app_data = apps[appid]
                logger.debug(f"App {appid} data keys: {list(app_data.keys()) if isinstance(app_data, dict) else 'not a dict'}")

                if isinstance(app_data, dict):
                    # Try all known playtime field names
                    for field in ["Playtime", "playtime", "PlaytimeForever", "playtime_forever",
                                  "TotalPlayTime", "totalplaytime", "playtime2", "Playtime2"]:
                        if field in app_data:
                            try:
                                return int(app_data[field])
                            except (ValueError, TypeError):
                                pass

            return 0

        except Exception as e:
            logger.error(f"Failed to parse config file: {e}")
            return 0

    async def get_game_name(self, appid: str) -> str:
        """Get game name from appmanifest files or shortcuts.vdf for non-Steam games"""
        if not self.steam_path:
            return f"Unknown Game ({appid})"

        # Check common steam library locations for Steam games
        library_folders = await self.get_library_folders()

        for library_path in library_folders:
            appmanifest_path = library_path / "steamapps" / f"appmanifest_{appid}.acf"

            if appmanifest_path.exists():
                try:
                    data = load_vdf_file(appmanifest_path)
                    game_name = data.get("AppState", {}).get("name", f"Unknown Game ({appid})")
                    return game_name

                except Exception as e:
                    logger.error(f"Failed to parse appmanifest for {appid}: {e}")

        # Check non-Steam games in shortcuts.vdf
        non_steam_games = await self.get_non_steam_games()
        for game in non_steam_games:
            if game.get('appid') == appid:
                return game.get('name', f"Unknown Game ({appid})")

        return f"Unknown Game ({appid})"

    async def get_steam_api_key(self) -> Optional[str]:
        """Get Steam Web API key from settings or environment"""
        # First check environment variable
        api_key = os.environ.get('STEAM_API_KEY')
        if api_key:
            return api_key

        # TODO: Add support for storing API key in plugin settings
        # For now, return None - user needs to set STEAM_API_KEY environment variable
        return None

    async def get_steam_id64(self, user_id: str) -> Optional[str]:
        """Convert Steam user ID (Steam3 format) to SteamID64

        Steam3 ID is the local account ID (e.g., "12345678")
        SteamID64 = 76561197960265728 + Steam3 ID
        """
        try:
            steam3_id = int(user_id)
            # SteamID64 formula for individual accounts in public universe
            steamid64 = 76561197960265728 + steam3_id
            return str(steamid64)
        except (ValueError, TypeError):
            logger.error(f"Failed to convert user_id {user_id} to SteamID64")
            return None

    async def get_achievements_from_web_api(self, appid: str, steamid64: str) -> Dict[str, Any]:
        """Fetch achievements from Steam Web API as fallback

        API: GET https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/
        Params: key, steamid, appid
        """
        import urllib.request
        import json as json_lib

        api_key = await self.get_steam_api_key()
        if not api_key:
            logger.debug(f"No Steam API key available for Web API fallback")
            return {"total": 0, "unlocked": 0, "percentage": 0.0}

        try:
            url = f"https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key={api_key}&steamid={steamid64}&appid={appid}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

            with urllib.request.urlopen(req, timeout=10) as response:
                data = json_lib.loads(response.read().decode())

                playerstats = data.get('playerstats', {})
                if not playerstats.get('success'):
                    logger.debug(f"Steam Web API returned success=false for appid {appid}")
                    return {"total": 0, "unlocked": 0, "percentage": 0.0}

                achievements = playerstats.get('achievements', [])
                if not achievements:
                    logger.debug(f"No achievements in Web API response for appid {appid}")
                    return {"total": 0, "unlocked": 0, "percentage": 0.0}

                total = len(achievements)
                unlocked = sum(1 for ach in achievements if ach.get('achieved') == 1)
                percentage = (unlocked / total * 100) if total > 0 else 0.0

                logger.info(f"Steam Web API: appid {appid} = {unlocked}/{total} achievements ({percentage:.1f}%)")

                return {
                    "total": total,
                    "unlocked": unlocked,
                    "percentage": round(percentage, 2)
                }

        except Exception as e:
            logger.debug(f"Steam Web API request failed for appid {appid}: {e}")
            return {"total": 0, "unlocked": 0, "percentage": 0.0}

    async def get_game_achievements(self, appid: str) -> Dict[str, Any]:
        """Get achievement progress for a game

        First tries local stats files, then falls back to Steam Web API if available
        """
        user_id = await self.get_steam_user_id()
        if not user_id or not self.steam_path:
            return {"total": 0, "unlocked": 0, "percentage": 0.0}

        # Try to get achievements from local stats file first (fastest)
        stats_path = self.steam_path / "userdata" / user_id / appid / "stats"

        if stats_path.exists():
            # Look for achievement files
            achievement_files = list(stats_path.glob("*.vdf"))

            if achievement_files:
                try:
                    # Parse the first achievement file found
                    data = load_vdf_file(achievement_files[0])

                    # Navigate to achievements
                    achievements = data.get("stats", {}).get("achievements", {})

                    if achievements:
                        total = len(achievements)
                        unlocked = sum(1 for ach in achievements.values()
                                      if isinstance(ach, dict) and ach.get("achieved", "0") == "1")
                        percentage = (unlocked / total * 100) if total > 0 else 0.0

                        return {
                            "total": total,
                            "unlocked": unlocked,
                            "percentage": round(percentage, 2)
                        }

                except Exception as e:
                    logger.error(f"Failed to parse local achievements for {appid}: {e}")

        # Fallback: Try Steam Web API
        logger.debug(f"No local achievements for {appid}, trying Steam Web API...")
        steamid64 = await self.get_steam_id64(user_id)
        if steamid64:
            return await self.get_achievements_from_web_api(appid, steamid64)

        return {"total": 0, "unlocked": 0, "percentage": 0.0}

    async def get_library_folders(self) -> List[Path]:
        """Get all Steam library folder paths"""
        if not self.steam_path:
            return []

        folders = [self.steam_path]

        libraryfolders_path = self.steam_path / "steamapps" / "libraryfolders.vdf"

        if not libraryfolders_path.exists():
            logger.debug("libraryfolders.vdf not found")
            return folders

        try:
            data = load_vdf_file(libraryfolders_path)

            # Parse library folders
            library_data = data.get("libraryfolders", {})

            for key, value in library_data.items():
                if isinstance(value, dict) and "path" in value:
                    folder_path = Path(value["path"])
                    if folder_path.exists():
                        folders.append(folder_path)

        except Exception as e:
            logger.error(f"Failed to parse libraryfolders.vdf: {e}")

        return folders

    async def get_all_games(self) -> List[Dict[str, Any]]:
        """Get all games in Steam library"""
        games = []
        library_folders = await self.get_library_folders()

        for library_path in library_folders:
            steamapps_path = library_path / "steamapps"

            if not steamapps_path.exists():
                continue

            # Find all appmanifest files
            appmanifest_files = steamapps_path.glob("appmanifest_*.acf")

            for manifest_path in appmanifest_files:
                try:
                    # Extract appid from filename
                    appid = manifest_path.stem.replace("appmanifest_", "")

                    data = load_vdf_file(manifest_path)

                    app_state = data.get("AppState", {})
                    game_name = app_state.get("name", f"Unknown ({appid})")

                    # Get playtime
                    playtime = await self.get_game_playtime(appid)

                    games.append({
                        "appid": appid,
                        "name": game_name,
                        "playtime_minutes": playtime
                    })

                except Exception as e:
                    logger.error(f"Failed to parse {manifest_path}: {e}")
                    continue

        logger.info(f"Found {len(games)} games in library")
        return games

    async def get_game_stats_full(self, appid: str) -> Dict[str, Any]:
        """Get complete game statistics (name, playtime, achievements)"""
        game_name = await self.get_game_name(appid)
        playtime = await self.get_game_playtime(appid)
        achievements = await self.get_game_achievements(appid)

        return {
            "appid": appid,
            "game_name": game_name,
            "playtime_minutes": playtime,
            "total_achievements": achievements["total"],
            "unlocked_achievements": achievements["unlocked"],
            "achievement_percentage": achievements["percentage"]
        }

    async def get_non_steam_games(self) -> List[Dict[str, Any]]:
        """Get non-Steam games from shortcuts.vdf"""
        logger.info("=== get_non_steam_games called ===")
        user_id = await self.get_steam_user_id()
        logger.info(f"[get_non_steam_games] user_id={user_id}, steam_path={self.steam_path}")
        if not user_id or not self.steam_path:
            logger.info("[get_non_steam_games] no user_id or steam_path, returning empty")
            return []

        shortcuts_path = self.steam_path / "userdata" / user_id / "config" / "shortcuts.vdf"
        logger.info(f"[get_non_steam_games] shortcuts_path={shortcuts_path}, exists={shortcuts_path.exists()}")

        if not shortcuts_path.exists():
            logger.info("[get_non_steam_games] shortcuts.vdf not found")
            return []

        games = []
        try:
            # shortcuts.vdf is a binary VDF file, need special parsing
            with open(shortcuts_path, 'rb') as f:
                content = f.read()
            logger.info(f"[get_non_steam_games] read {len(content)} bytes from shortcuts.vdf")

            # Parse binary VDF format for shortcuts
            # This is a simplified parser that extracts appid and appname
            games = self._parse_shortcuts_binary(content)
            logger.info(f"[get_non_steam_games] parsed {len(games)} non-Steam games")
            if games:
                logger.info(f"[get_non_steam_games] sample: {games[:3]}")

        except Exception as e:
            logger.error(f"Failed to parse shortcuts.vdf: {e}")
            import traceback
            logger.error(traceback.format_exc())

        return games

    def _parse_shortcuts_binary(self, content: bytes) -> List[Dict[str, Any]]:
        """Parse binary shortcuts.vdf format

        Binary VDF format uses:
        - 0x00 for nested object start
        - 0x01 for string type (followed by key\x00value\x00)
        - 0x02 for int32 type (followed by key\x00 + 4 bytes)
        - 0x08 for end of object
        """
        games = []

        try:
            # Find all appname occurrences (lowercase, as seen in actual file)
            appname_marker = b'\x01appname\x00'
            appid_marker = b'\x02appid\x00'

            pos = 0
            while True:
                # Find next appname
                name_pos = content.find(appname_marker, pos)
                if name_pos == -1:
                    break

                # Extract app name (null-terminated string after marker)
                name_start = name_pos + len(appname_marker)
                name_end = content.find(b'\x00', name_start)
                if name_end == -1:
                    break

                app_name = content[name_start:name_end].decode('utf-8', errors='ignore')

                # Look for appid before appname (it comes first in each entry)
                # Search backwards from appname position
                search_start = max(0, name_pos - 100)
                search_chunk = content[search_start:name_pos]

                appid = None
                appid_offset = search_chunk.rfind(appid_marker)  # Find last occurrence before appname
                if appid_offset != -1:
                    appid_start = appid_offset + len(appid_marker)
                    if appid_start + 4 <= len(search_chunk):
                        appid_bytes = search_chunk[appid_start:appid_start + 4]
                        # Interpret as unsigned 32-bit integer
                        appid = int.from_bytes(appid_bytes, 'little', signed=False)

                if app_name and appid:
                    games.append({
                        "appid": str(appid),
                        "name": app_name,
                        "playtime_minutes": 0,
                        "is_non_steam": True
                    })
                    logger.debug(f"[_parse_shortcuts_binary] Found: {app_name} (appid={appid})")

                pos = name_end + 1

        except Exception as e:
            logger.error(f"Error parsing shortcuts binary: {e}")
            import traceback
            logger.error(traceback.format_exc())

        logger.info(f"[_parse_shortcuts_binary] Parsed {len(games)} games")
        return games
