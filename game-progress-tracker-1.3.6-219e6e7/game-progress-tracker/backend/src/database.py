"""
Database module for Game Progress Tracker
Handles SQLite operations for tags, cache, and settings
Uses standard library sqlite3 with asyncio.to_thread for async operations
"""

import sqlite3
import asyncio
import time
from pathlib import Path
from typing import Optional, Dict, Any, List

# Use Decky's built-in logger
import decky
logger = decky.logger


class Database:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.connection: Optional[sqlite3.Connection] = None

    def _connect_sync(self):
        """Synchronous connection for use with to_thread"""
        # check_same_thread=False allows connection to be used across threads
        # This is safe because we serialize access through asyncio.to_thread
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    async def connect(self):
        """Establish database connection"""
        self.connection = await asyncio.to_thread(self._connect_sync)
        logger.info(f"Connected to database: {self.db_path}")

    async def close(self):
        """Close database connection"""
        if self.connection:
            await asyncio.to_thread(self.connection.close)
            logger.info("Database connection closed")

    def _init_schema_sync(self, conn):
        """Synchronous schema initialization"""
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS game_tags (
                appid TEXT PRIMARY KEY,
                tag TEXT NOT NULL,
                is_manual BOOLEAN DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tags_tag ON game_tags(tag)
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_tags_manual ON game_tags(is_manual)
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hltb_cache (
                appid TEXT PRIMARY KEY,
                game_name TEXT NOT NULL,
                matched_name TEXT,
                similarity_score REAL,
                main_story REAL,
                main_extra REAL,
                completionist REAL,
                all_styles REAL,
                hltb_url TEXT,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_hltb_cached_at ON hltb_cache(cached_at)
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS game_stats (
                appid TEXT PRIMARY KEY,
                game_name TEXT NOT NULL,
                playtime_minutes INTEGER DEFAULT 0,
                total_achievements INTEGER DEFAULT 0,
                unlocked_achievements INTEGER DEFAULT 0,
                is_hidden BOOLEAN DEFAULT 0,
                rt_last_time_played INTEGER,
                last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Migration: Add is_hidden column if it doesn't exist
        cursor.execute("PRAGMA table_info(game_stats)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'is_hidden' not in columns:
            cursor.execute("ALTER TABLE game_stats ADD COLUMN is_hidden BOOLEAN DEFAULT 0")
        if 'rt_last_time_played' not in columns:
            cursor.execute("ALTER TABLE game_stats ADD COLUMN rt_last_time_played INTEGER")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        # Insert default settings
        # Note: mastered_multiplier is no longer used (mastered = 100% achievements)
        cursor.execute("""
            INSERT OR IGNORE INTO settings (key, value) VALUES
                ('auto_tag_enabled', 'true'),
                ('in_progress_threshold', '30'),
                ('cache_ttl', '7200'),
                ('source_installed', 'true'),
                ('source_non_steam', 'true'),
                ('source_all_owned', 'true')
        """)

        conn.commit()

    async def init_database(self):
        """Initialize database schema"""
        if not self.connection:
            await self.connect()

        await asyncio.to_thread(self._init_schema_sync, self.connection)
        logger.info("Database schema initialized")

    # Tag operations
    def _get_tag_sync(self, conn, appid: str):
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM game_tags WHERE appid = ?", (appid,))
        return cursor.fetchone()

    async def get_tag(self, appid: str) -> Optional[Dict[str, Any]]:
        """Get tag for a specific game"""
        if not self.connection:
            return None

        row = await asyncio.to_thread(self._get_tag_sync, self.connection, appid)

        if row:
            return {
                "appid": row["appid"],
                "tag": row["tag"],
                "is_manual": bool(row["is_manual"]),
                "last_updated": row["last_updated"]
            }
        return None

    def _set_tag_sync(self, conn, appid: str, tag: str, is_manual: bool):
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO game_tags (appid, tag, is_manual, last_updated)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(appid) DO UPDATE SET
                tag = excluded.tag,
                is_manual = excluded.is_manual,
                last_updated = CURRENT_TIMESTAMP
        """, (appid, tag, int(is_manual)))
        conn.commit()

    async def set_tag(self, appid: str, tag: str, is_manual: bool = False) -> bool:
        """Set or update tag for a game"""
        if not self.connection:
            return False

        try:
            await asyncio.to_thread(self._set_tag_sync, self.connection, appid, tag, is_manual)
            logger.debug(f"Set tag for {appid}: {tag} (manual={is_manual})")
            return True
        except Exception as e:
            logger.error(f"Failed to set tag for {appid}: {e}")
            return False

    def _remove_tag_sync(self, conn, appid: str):
        cursor = conn.cursor()
        cursor.execute("DELETE FROM game_tags WHERE appid = ?", (appid,))
        conn.commit()

    async def remove_tag(self, appid: str) -> bool:
        """Remove tag from a game"""
        if not self.connection:
            return False

        try:
            await asyncio.to_thread(self._remove_tag_sync, self.connection, appid)
            logger.debug(f"Removed tag for {appid}")
            return True
        except Exception as e:
            logger.error(f"Failed to remove tag for {appid}: {e}")
            return False

    def _get_all_tags_sync(self, conn):
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM game_tags")
        return cursor.fetchall()

    async def get_all_tags(self) -> List[Dict[str, Any]]:
        """Get all game tags"""
        if not self.connection:
            return []

        rows = await asyncio.to_thread(self._get_all_tags_sync, self.connection)

        return [
            {
                "appid": row["appid"],
                "tag": row["tag"],
                "is_manual": bool(row["is_manual"]),
                "last_updated": row["last_updated"]
            }
            for row in rows
        ]

    # HLTB cache operations
    def _cache_hltb_sync(self, conn, appid: str, data: Dict[str, Any]):
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO hltb_cache (
                appid, game_name, matched_name, similarity_score,
                main_story, main_extra, completionist, all_styles,
                hltb_url, cached_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(appid) DO UPDATE SET
                game_name = excluded.game_name,
                matched_name = excluded.matched_name,
                similarity_score = excluded.similarity_score,
                main_story = excluded.main_story,
                main_extra = excluded.main_extra,
                completionist = excluded.completionist,
                all_styles = excluded.all_styles,
                hltb_url = excluded.hltb_url,
                cached_at = CURRENT_TIMESTAMP
        """, (
            appid,
            data.get("game_name"),
            data.get("matched_name"),
            data.get("similarity"),
            data.get("main_story"),
            data.get("main_extra"),
            data.get("completionist"),
            data.get("all_styles"),
            data.get("hltb_url")
        ))
        conn.commit()

    async def cache_hltb_data(self, appid: str, data: Dict[str, Any]) -> bool:
        """Cache HowLongToBeat data"""
        if not self.connection:
            return False

        try:
            await asyncio.to_thread(self._cache_hltb_sync, self.connection, appid, data)
            logger.debug(f"Cached HLTB data for {appid}")
            return True
        except Exception as e:
            logger.error(f"Failed to cache HLTB data for {appid}: {e}")
            return False

    def _get_hltb_cache_sync(self, conn, appid: str):
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM hltb_cache WHERE appid = ?", (appid,))
        return cursor.fetchone()

    async def get_hltb_cache(self, appid: str, ttl: int = 7200) -> Optional[Dict[str, Any]]:
        """Get cached HLTB data if not expired"""
        if not self.connection:
            return None

        row = await asyncio.to_thread(self._get_hltb_cache_sync, self.connection, appid)

        if not row:
            return None

        # Check if cache is expired
        cached_timestamp = row["cached_at"]
        current_time = time.time()

        try:
            cached_time = float(cached_timestamp)
        except (ValueError, TypeError):
            cached_time = current_time

        if current_time - cached_time > ttl:
            logger.debug(f"HLTB cache expired for {appid}")
            return None

        return {
            "appid": row["appid"],
            "game_name": row["game_name"],
            "matched_name": row["matched_name"],
            "similarity": row["similarity_score"],
            "main_story": row["main_story"],
            "main_extra": row["main_extra"],
            "completionist": row["completionist"],
            "all_styles": row["all_styles"],
            "hltb_url": row["hltb_url"]
        }

    # Game stats operations
    def _update_stats_sync(self, conn, appid: str, stats: Dict[str, Any]):
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO game_stats (
                appid, game_name, playtime_minutes,
                total_achievements, unlocked_achievements, is_hidden, rt_last_time_played, last_sync
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(appid) DO UPDATE SET
                game_name = excluded.game_name,
                playtime_minutes = excluded.playtime_minutes,
                total_achievements = excluded.total_achievements,
                unlocked_achievements = excluded.unlocked_achievements,
                is_hidden = excluded.is_hidden,
                rt_last_time_played = excluded.rt_last_time_played,
                last_sync = CURRENT_TIMESTAMP
        """, (
            appid,
            stats.get("game_name", ""),
            stats.get("playtime_minutes", 0),
            stats.get("total_achievements", 0),
            stats.get("unlocked_achievements", 0),
            int(stats.get("is_hidden", False)),
            stats.get("rt_last_time_played")
        ))
        conn.commit()

    async def update_game_stats(self, appid: str, stats: Dict[str, Any]) -> bool:
        """Update game statistics"""
        if not self.connection:
            return False

        try:
            await asyncio.to_thread(self._update_stats_sync, self.connection, appid, stats)
            logger.debug(f"Updated stats for {appid}")
            return True
        except Exception as e:
            logger.error(f"Failed to update stats for {appid}: {e}")
            return False

    def _get_stats_sync(self, conn, appid: str):
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM game_stats WHERE appid = ?", (appid,))
        return cursor.fetchone()

    async def get_game_stats(self, appid: str) -> Optional[Dict[str, Any]]:
        """Get game statistics"""
        if not self.connection:
            return None

        row = await asyncio.to_thread(self._get_stats_sync, self.connection, appid)

        if row:
            # Handle case where is_hidden column might not exist yet (migration)
            try:
                is_hidden = bool(row["is_hidden"])
            except (KeyError, IndexError):
                is_hidden = False

            # Handle case where rt_last_time_played might not exist yet (migration)
            try:
                rt_last_time_played = row["rt_last_time_played"]
            except (KeyError, IndexError):
                rt_last_time_played = None

            return {
                "appid": row["appid"],
                "game_name": row["game_name"],
                "playtime_minutes": row["playtime_minutes"],
                "total_achievements": row["total_achievements"],
                "unlocked_achievements": row["unlocked_achievements"],
                "is_hidden": is_hidden,
                "rt_last_time_played": rt_last_time_played,
                "last_sync": row["last_sync"]
            }
        return None

    def _get_all_game_stats_sync(self, conn, include_hidden: bool = True):
        cursor = conn.cursor()
        if include_hidden:
            cursor.execute("SELECT appid FROM game_stats")
        else:
            cursor.execute("SELECT appid FROM game_stats WHERE is_hidden = 0 OR is_hidden IS NULL")
        return cursor.fetchall()

    async def get_all_game_stats(self, include_hidden: bool = True) -> List[Dict[str, Any]]:
        """Get all game statistics records (appid only for counting)"""
        if not self.connection:
            return []

        rows = await asyncio.to_thread(self._get_all_game_stats_sync, self.connection, include_hidden)
        return [{"appid": row["appid"]} for row in rows]

    # Settings operations
    def _get_setting_sync(self, conn, key: str):
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM settings WHERE key = ?", (key,))
        return cursor.fetchone()

    async def get_setting(self, key: str, default: Any = None) -> Any:
        """Get a setting value"""
        if not self.connection:
            return default

        row = await asyncio.to_thread(self._get_setting_sync, self.connection, key)

        if row:
            value = row["value"]
            if value.lower() in ('true', 'false'):
                return value.lower() == 'true'
            try:
                return float(value)
            except ValueError:
                return value
        return default

    def _set_setting_sync(self, conn, key: str, value: str):
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO settings (key, value)
            VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """, (key, value))
        conn.commit()

    async def set_setting(self, key: str, value: Any) -> bool:
        """Set a setting value"""
        if not self.connection:
            return False

        try:
            str_value = str(value).lower() if isinstance(value, bool) else str(value)
            await asyncio.to_thread(self._set_setting_sync, self.connection, key, str_value)
            logger.debug(f"Set setting {key} = {value}")
            return True
        except Exception as e:
            logger.error(f"Failed to set setting {key}: {e}")
            return False

    def _get_all_settings_sync(self, conn):
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        return cursor.fetchall()

    async def get_all_settings(self) -> Dict[str, Any]:
        """Get all settings"""
        if not self.connection:
            return {}

        rows = await asyncio.to_thread(self._get_all_settings_sync, self.connection)

        settings = {}
        for row in rows:
            key = row["key"]
            value = row["value"]

            if value.lower() in ('true', 'false'):
                settings[key] = value.lower() == 'true'
            else:
                try:
                    settings[key] = float(value)
                except ValueError:
                    settings[key] = value

        return settings

    def _get_games_eligible_for_dropped_sync(self, conn, days_threshold: int):
        """Get games that should be tagged as dropped (synchronous)"""
        cursor = conn.cursor()

        # Calculate timestamp threshold (current time - days)
        import time
        current_time = int(time.time())
        threshold_timestamp = current_time - (days_threshold * 24 * 60 * 60)

        # Query: Find games where:
        # 1. rt_last_time_played exists and is older than threshold
        # 2. Game is not hidden
        # 3. Game is not manually tagged
        # 4. Game is not completed or mastered (either has no tag, or is in_progress)
        cursor.execute("""
            SELECT gs.appid, gs.game_name, gs.rt_last_time_played, gt.tag, gt.is_manual
            FROM game_stats gs
            LEFT JOIN game_tags gt ON gs.appid = gt.appid
            WHERE gs.rt_last_time_played IS NOT NULL
                AND gs.rt_last_time_played > 0
                AND gs.rt_last_time_played < ?
                AND (gs.is_hidden = 0 OR gs.is_hidden IS NULL)
                AND (gt.is_manual = 0 OR gt.is_manual IS NULL)
                AND (gt.tag IS NULL OR gt.tag = 'in_progress')
                AND (gt.tag != 'dropped' OR gt.tag IS NULL)
        """, (threshold_timestamp,))

        return cursor.fetchall()

    async def get_games_eligible_for_dropped(self, days_threshold: int = 365) -> List[Dict[str, Any]]:
        """Get games that should be tagged as dropped

        Returns games that:
        - Have rt_last_time_played older than days_threshold
        - Are not hidden
        - Are not manually tagged
        - Are not completed/mastered (either no tag or in_progress)
        - Are not already dropped
        """
        if not self.connection:
            return []

        rows = await asyncio.to_thread(self._get_games_eligible_for_dropped_sync, self.connection, days_threshold)

        return [
            {
                "appid": row["appid"],
                "game_name": row["game_name"],
                "rt_last_time_played": row["rt_last_time_played"],
                "current_tag": row["tag"] if len(row) > 3 else None,
                "is_manual": bool(row["is_manual"]) if len(row) > 4 else False
            }
            for row in rows
        ]
