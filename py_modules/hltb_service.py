"""
HowLongToBeat Service
Fetches game completion times from HowLongToBeat using standard library only
"""

import asyncio
import gzip
import json
import ssl
import time
from difflib import SequenceMatcher
from typing import Any, Dict, Optional
from urllib.request import Request, urlopen

import decky

# Use Decky's built-in logger
logger = decky.logger


class RequestUtils:
    """Utility class for making HTTP requests to HLTB."""
    
    def __init__(self, user_agent: str):
        self.user_agent = user_agent
    
    @staticmethod
    def _create_ssl_context() -> ssl.SSLContext:
        """Create SSL context without certificate verification."""
        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
        return context

    def make_request(self, url: str, data: Optional[bytes] = None, 
                     method: str = "GET", extra_headers: Dict[str, str] = None) -> bytes:
        """Make HTTP request to HLTB.
        
        Args:
            url: The URL to request
            data: Request body for POST requests
            method: HTTP method (GET or POST)
            extra_headers: Additional headers to include
            
        Returns:
            Raw response bytes
        """
        headers = {
            "User-Agent": self.user_agent,
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Prefer": "safe",
            "Referer": "https://howlongtobeat.com/",
            "Connection": "keep-alive",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
        }
        
        if extra_headers:
            headers.update(extra_headers)
        
        req = Request(url, data=data, headers=headers, method=method)
        
        ssl_context = self._create_ssl_context()
        
        with urlopen(req, timeout=15, context=ssl_context) as response:
            raw_data = response.read()
            
            # Handle compression based on Content-Encoding header
            content_encoding = response.headers.get('Content-Encoding', '').lower()
            if 'gzip' in content_encoding:
                return gzip.decompress(raw_data)
            else:
                return raw_data


class HLTBService:
    """Service for fetching game completion times from HowLongToBeat.com"""
    
    # Auth token expiration time (in seconds)
    TOKEN_EXPIRY_SECONDS = 600
    
    def __init__(self):
        self.min_similarity = 0.7  # Minimum similarity threshold
        self.base_url = "https://howlongtobeat.com"
        self.user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:152.0) Gecko/20100101 Firefox/152.0"
        
        # Dynamic auth values (fetched from API on first use)
        self.auth_token = None
        self.hp_key = None
        self.hp_val = None
        self.token_timestamp = 0
        
        # Initialize request utils with user agent
        self._request_utils = RequestUtils(self.user_agent)

    def _get_auth_data_sync(self) -> Optional[Dict[str, str]]:
        """Get dynamic auth data from HLTB init endpoint.
        
        Returns:
            Dict with token, hp_key, and hp_val if successful, None otherwise.
        """
        url = f"{self.base_url}/api/bleed/init?t={int(time.time() * 1000)}"
        
        try:
            response = self._request_utils.make_request(url, method="GET")
            data = json.loads(response.decode('utf-8'))
            
            token = data.get('token')
            hp_key = data.get('hpKey')
            hp_val = data.get('hpVal')
            
            if all([token, hp_key, hp_val]):
                logger.info(f"Got fresh HLTB auth data (key: {hp_key})")
                return {"token": token, "hp_key": hp_key, "hp_val": hp_val}
                
        except Exception as e:
            logger.error(f"Failed to get HLTB auth data: {e}")
        
        return None

    def _calculate_similarity(self, str1: str, str2: str) -> float:
        """Calculate string similarity using SequenceMatcher."""
        return SequenceMatcher(None, str1.lower(), str2.lower()).ratio()

    def _sanitize_game_name(self, game_name: str) -> str:
        """Sanitize game name for better HLTB search matching.
        
        Removes special characters and common edition suffixes that can interfere
        with search matching.
        """
        import re

        # Remove common suffixes that don't help with matching
        suffix_patterns = [
            r'\s*-\s*Steam Special Edition',
            r'\s*-\s*Special Edition',
            r'\s*-\s*Enhanced Edition',
            r'\s*-\s*Game of the Year',
            r'\s*-\s*GOTY',
            r'\s*-\s*Anniversary Edition',
            r'\s*-\s*Definitive Edition',
            r'\s*\(\d{4}\)',  # Year in parentheses like (2008)
        ]
        
        result = game_name
        for pattern in suffix_patterns:
            result = re.sub(pattern, '', result, flags=re.IGNORECASE)
        
        # Replace hyphens and colons with spaces, remove other special chars
        result = re.sub(r'[-:]+', ' ', result)
        result = re.sub(r'[^\w\s]', '', result)
        result = re.sub(r'\s+', ' ', result).strip()
        
        return result

    def _search_sync(self, game_name: str) -> Optional[Dict[str, Any]]:
        """Synchronous HLTB search using /api/bleed endpoint
        
        Args:
            game_name: The name of the game to search for
            
        Returns:
            Dict with game data if found, None otherwise
        """
        # Get fresh auth data if not available or expired (refresh every 10 minutes)
        current_time = time.time()
        is_auth_expired = (current_time - self.token_timestamp) > self.TOKEN_EXPIRY_SECONDS
        
        if not self.auth_token or is_auth_expired:
            logger.info("Fetching fresh HLTB auth data...")
            auth_data = self._get_auth_data_sync()
            if not auth_data:
                logger.error("Failed to get HLTB auth data")
                return None
            
            self.auth_token = auth_data["token"]
            self.hp_key = auth_data["hp_key"]
            self.hp_val = auth_data["hp_val"]
            self.token_timestamp = current_time

        # Sanitize game name for better search matching
        sanitized_name = self._sanitize_game_name(game_name)

        # Build headers with dynamic auth values
        auth_headers = {
            "Content-Type": "application/json",
            "x-auth-token": self.auth_token,
            "x-hp-key": self.hp_key,
            "x-hp-val": self.hp_val,
            "Cache-Control": "no-cache",
        }

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
                    "rangeTime": {"min": None, "max": None},
                    "gameplay": {"perspective": "", "flow": "", "genre": "", "difficulty": ""},
                    "rangeYear": {"min": "", "max": ""},
                    "modifier": ""
                },
                "users": {"sortCategory": "postcount"},
                "lists": {"sortCategory": "follows"},
                "filter": "",
                "sort": 0,
                "randomizer": 0
            },
            "useCache": True,
        }
        payload[self.hp_key] = self.hp_val

        url = f"{self.base_url}/api/bleed"
        
        try:
            response_data = self._request_utils.make_request(
                url, 
                data=json.dumps(payload).encode('utf-8'),
                method="POST",
                extra_headers=auth_headers
            )
            
            result = json.loads(response_data.decode('utf-8'))

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
        """Search HLTB for game completion times.
        
        Args:
            game_name: The name of the game to search for
            
        Returns:
            Dict with game data if found, None otherwise
        """
        # Skip empty or invalid inputs
        if not game_name or not game_name.strip() or game_name.startswith("Unknown"):
            return None

        # Skip non-game entries (Proton, Steam Runtime, etc.)
        skip_patterns = [
            "proton", "steam linux runtime", "steamworks",
            "redistributable", "directx", "vcredist"
        ]
        name_lower = game_name.lower()
        for pattern in skip_patterns:
            if pattern in name_lower:
                return None

        try:
            # Run sync request in thread pool
            result = await asyncio.to_thread(self._search_sync, game_name)

            if result:
                logger.info(f"HLTB: {result['matched_name']} (similarity: {result['similarity']:.2f})")

            return result

        except Exception as e:
            logger.error(f"HLTB search failed for {game_name}: {e}")
            return None
