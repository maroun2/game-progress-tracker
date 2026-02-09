"""
HowLongToBeat Service
Fetches game completion times from HowLongToBeat using standard library only
"""

import asyncio
import json
import ssl
import re
import urllib.request
import urllib.parse
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
        self.api_url = "https://howlongtobeat.com/api/s/"  # New API endpoint
        self.auth_token = None
        self.user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate string similarity using SequenceMatcher"""
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

    def _get_auth_token_sync(self) -> Optional[str]:
        """Get auth token from HLTB init endpoint"""
        try:
            init_url = f"{self.api_url}init"
            headers = {
                "User-Agent": self.user_agent,
                "Accept": "*/*",
                "Referer": f"{self.base_url}/",
            }

            req = urllib.request.Request(init_url, headers=headers, method='GET')

            with urllib.request.urlopen(req, timeout=10, context=SSL_CONTEXT) as response:
                result = json.loads(response.read().decode('utf-8'))
                token = result.get("token") or result.get("auth_token")
                if token:
                    logger.debug(f"Got HLTB auth token")
                    return token

        except Exception as e:
            logger.debug(f"Failed to get auth token from init: {e}")

        # Fallback: try to extract from main page script
        try:
            headers = {
                "User-Agent": self.user_agent,
                "Accept": "text/html",
            }
            req = urllib.request.Request(self.base_url, headers=headers, method='GET')

            with urllib.request.urlopen(req, timeout=10, context=SSL_CONTEXT) as response:
                html = response.read().decode('utf-8')

                # Look for api key patterns in script tags
                patterns = [
                    r'api_key["\']?\s*[:=]\s*["\']([^"\']+)["\']',
                    r'authToken["\']?\s*[:=]\s*["\']([^"\']+)["\']',
                    r'x-auth-token["\']?\s*[:=]\s*["\']([^"\']+)["\']',
                ]

                for pattern in patterns:
                    match = re.search(pattern, html, re.IGNORECASE)
                    if match:
                        logger.debug(f"Found auth token via pattern")
                        return match.group(1)

        except Exception as e:
            logger.debug(f"Failed to extract auth token from HTML: {e}")

        return None

    def _search_sync(self, game_name: str) -> Optional[Dict[str, Any]]:
        """Synchronous HLTB search"""
        try:
            # Get auth token if we don't have one
            if not self.auth_token:
                self.auth_token = self._get_auth_token_sync()

            # Build headers
            headers = {
                "Content-Type": "application/json",
                "Accept": "*/*",
                "User-Agent": self.user_agent,
                "Referer": f"{self.base_url}/",
                "Origin": self.base_url,
            }

            if self.auth_token:
                headers["x-auth-token"] = self.auth_token

            # HLTB API payload
            payload = {
                "searchType": "games",
                "searchTerms": game_name.split(),
                "searchPage": 1,
                "size": 20,
                "searchOptions": {
                    "games": {
                        "userId": 0,
                        "platform": "",
                        "sortCategory": "popular",
                        "rangeCategory": "main",
                        "modifier": ""
                    }
                },
                "useCache": True
            }

            data = json.dumps(payload).encode('utf-8')

            # Try new API endpoint first
            search_url = self.api_url
            req = urllib.request.Request(
                search_url,
                data=data,
                headers=headers,
                method='POST'
            )

            try:
                with urllib.request.urlopen(req, timeout=10, context=SSL_CONTEXT) as response:
                    result = json.loads(response.read().decode('utf-8'))
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    # Try old endpoint as fallback
                    logger.debug("New API returned 404, trying old endpoint")
                    old_url = f"{self.base_url}/api/search"
                    req = urllib.request.Request(
                        old_url,
                        data=data,
                        headers=headers,
                        method='POST'
                    )
                    with urllib.request.urlopen(req, timeout=10, context=SSL_CONTEXT) as response:
                        result = json.loads(response.read().decode('utf-8'))
                else:
                    raise

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
