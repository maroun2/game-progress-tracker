"""
HowLongToBeat Service
Fetches game completion times from HowLongToBeat using standard library only
"""

import asyncio
import json
import ssl
import time
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List
from difflib import SequenceMatcher

# Create SSL context that doesn't verify certificates (Steam Deck may have cert issues)
SSL_CONTEXT = ssl.create_default_context()
SSL_CONTEXT.check_hostname = False
SSL_CONTEXT.verify_mode = ssl.CERT_NONE

# Use Decky's built-in logger
import decky
logger = decky.logger


class HLTBService:
    def __init__(self):
        self.min_similarity = 0.7  # Minimum similarity threshold
        self.base_url = "https://howlongtobeat.com"
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        self.auth_token = None
        self.token_timestamp = 0

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate string similarity using SequenceMatcher"""
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

    def _get_auth_token_sync(self) -> Optional[str]:
        """Get auth token from HLTB finder/init endpoint"""
        try:
            timestamp = int(time.time() * 1000)
            init_url = f"{self.base_url}/api/finder/init?t={timestamp}"

            headers = {
                "User-Agent": self.user_agent,
                "Referer": f"{self.base_url}/",
                "Origin": self.base_url,
                "Accept": "application/json",
            }

            req = urllib.request.Request(init_url, headers=headers)

            with urllib.request.urlopen(req, timeout=10, context=SSL_CONTEXT) as response:
                result = json.loads(response.read().decode('utf-8'))
                token = result.get('token')
                if token:
                    logger.debug(f"Got HLTB auth token")
                    return token

        except Exception as e:
            logger.error(f"Failed to get HLTB auth token: {e}")

        return None

    def _sanitize_game_name(self, game_name: str) -> str:
        """Sanitize game name for better HLTB search matching.
        Removes special characters that can interfere with search."""
        import re
        # Remove common suffixes that don't help with matching
        suffixes_to_remove = [
            r'\s*-\s*Steam Special Edition',
            r'\s*-\s*Special Edition',
            r'\s*-\s*Enhanced Edition',
            r'\s*-\s*Game of the Year',
            r'\s*-\s*GOTY',
            r'\s*-\s*Anniversary Edition',
            r'\s*-\s*Definitive Edition',
            r'\s*\([\d]{4}\)',  # Year in parentheses like (2008)
        ]
        result = game_name
        for suffix in suffixes_to_remove:
            result = re.sub(suffix, '', result, flags=re.IGNORECASE)

        # Replace hyphens and colons with spaces (e.g., "Brothers - A Tale" -> "Brothers A Tale")
        result = re.sub(r'[-:]+', ' ', result)
        # Remove other special characters but keep alphanumeric and spaces
        result = re.sub(r'[^\w\s]', '', result)
        # Collapse multiple spaces
        result = re.sub(r'\s+', ' ', result).strip()

        if result != game_name:
            logger.debug(f"Sanitized game name: '{game_name}' -> '{result}'")

        return result

    def _search_sync(self, game_name: str) -> Optional[Dict[str, Any]]:
        """Synchronous HLTB search"""
        try:
            # Get fresh auth token (tokens may expire)
            current_time = time.time()
            if not self.auth_token or (current_time - self.token_timestamp) > 300:  # Refresh every 5 min
                self.auth_token = self._get_auth_token_sync()
                self.token_timestamp = current_time

            if not self.auth_token:
                logger.error("Could not get HLTB auth token")
                return None

            # Build headers - Accept: application/json is important!
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": self.user_agent,
                "Referer": f"{self.base_url}/",
                "Origin": self.base_url,
                "x-auth-token": self.auth_token,
            }

            # Sanitize game name for better search matching
            sanitized_name = self._sanitize_game_name(game_name)

            # HLTB API payload
            payload = {
                "searchType": "games",
                "searchTerms": sanitized_name.split(),
                "searchPage": 1,
                "size": 20,
                "searchOptions": {
                    "games": {
                        "userId": 0,
                        "platform": "",
                        "sortCategory": "popular",
                        "rangeCategory": "main",
                        "rangeTime": {"min": 0, "max": 0},
                        "gameplay": {"perspective": "", "flow": "", "genre": "", "difficulty": ""},
                        "rangeYear": {"min": "", "max": ""},
                        "modifier": ""
                    },
                    "users": {"sortCategory": "postcount"},
                    "lists": {"sortCategory": "follows"},
                    "filter": "",
                    "sort": 0,
                    "randomizer": 0
                }
            }

            data = json.dumps(payload).encode('utf-8')
            url = f"{self.base_url}/api/finder"

            req = urllib.request.Request(url, data=data, headers=headers, method='POST')

            with urllib.request.urlopen(req, timeout=15, context=SSL_CONTEXT) as response:
                result = json.loads(response.read().decode('utf-8'))

            games = result.get("data", [])
            if not games:
                return None

            # Find best match by name similarity
            best_match = None
            best_similarity = 0.0

            for game in games:
                game_title = game.get("game_name", "")
                similarity = self._calculate_similarity(game_name, game_title)

                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match = game

            if not best_match or best_similarity < self.min_similarity:
                return None

            # Extract times (convert from seconds to hours)
            def to_hours(seconds):
                if seconds and seconds > 0:
                    return round(seconds / 3600, 1)
                return None

            return {
                "game_name": game_name,
                "matched_name": best_match.get("game_name"),
                "similarity": round(best_similarity, 2),
                "main_story": to_hours(best_match.get("comp_main")),
                "main_extra": to_hours(best_match.get("comp_plus")),
                "completionist": to_hours(best_match.get("comp_100")),
                "all_styles": to_hours(best_match.get("comp_all")),
                "hltb_url": f"https://howlongtobeat.com/game/{best_match.get('game_id')}"
            }

        except Exception as e:
            logger.error(f"HLTB search error: {e}")
            return None

    async def search_game(self, game_name: str) -> Optional[Dict[str, Any]]:
        """Search HLTB for game completion times"""
        if not game_name or game_name.startswith("Unknown"):
            return None

        # Skip non-game entries (Proton, Steam Runtime, etc.)
        skip_patterns = [
            "proton", "steam linux runtime", "steamworks",
            "redistributable", "directx", "vcredist"
        ]
        name_lower = game_name.lower()
        for pattern in skip_patterns:
            if pattern in name_lower:
                logger.debug(f"Skipping non-game: {game_name}")
                return None

        try:
            logger.debug(f"Searching HLTB for: {game_name}")

            # Run sync request in thread pool
            result = await asyncio.to_thread(self._search_sync, game_name)

            if result:
                logger.info(
                    f"Found HLTB match: {result['matched_name']} "
                    f"(similarity: {result['similarity']:.2f})"
                )
            else:
                logger.debug(f"No HLTB results found for: {game_name}")

            return result

        except Exception as e:
            logger.error(f"HLTB search failed for {game_name}: {e}")
            return None

    async def bulk_fetch_games(
        self,
        game_list: List[Dict[str, str]],
        delay: float = 1.0,
        progress_callback=None
    ) -> Dict[str, Dict[str, Any]]:
        """Batch fetch multiple games with rate limiting"""
        results = {}
        total = len(game_list)

        for i, game in enumerate(game_list):
            appid = game.get("appid")
            game_name = game.get("name")

            if not appid or not game_name:
                continue

            result = await self.search_game(game_name)

            if result:
                results[appid] = result

            # Progress callback
            if progress_callback:
                progress_callback(i + 1, total)

            # Rate limiting delay
            if i < total - 1:  # Don't delay after last item
                await asyncio.sleep(delay)

        logger.info(f"Bulk fetch completed: {len(results)}/{total} games found")
        return results

    async def get_completion_time(
        self,
        appid: str,
        game_name: str,
        cache_lookup_func=None
    ) -> Optional[Dict[str, Any]]:
        """
        Get completion time for a game, checking cache first
        """
        # Check cache if function provided
        if cache_lookup_func:
            cached_data = await cache_lookup_func(appid)
            if cached_data:
                logger.debug(f"Using cached HLTB data for {appid}")
                return cached_data

        # Fetch fresh data
        return await self.search_game(game_name)
