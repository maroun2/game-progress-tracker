/**
 * Sync Utilities
 * Shared functions for syncing game data using Steam's frontend API
 */
/**
 * Achievement data structure
 */
export interface AchievementData {
    total: number;
    unlocked: number;
    percentage: number;
    all_unlocked: boolean;
}
/**
 * Sync result from backend
 */
export interface SyncResult {
    success: boolean;
    total?: number;
    synced?: number;
    new_tags?: number;
    errors?: number;
    error?: string;
}
/**
 * Get all owned game appids from Steam's frontend API
 * This includes both installed and uninstalled games
 * Uses window.appStore which has access to the full library
 */
export declare const getAllOwnedGameIds: () => Promise<string[]>;
/**
 * Get achievement data for a list of appids from Steam's frontend API
 * Uses window.appAchievementProgressCache.m_achievementProgress.mapCache for full data
 */
export declare const getAchievementData: (appids: string[]) => Promise<Record<string, AchievementData>>;
/**
 * Game data structure including playtime and last played timestamp
 */
export interface GameData {
    playtime_minutes: number;
    rt_last_time_played: number | null;
}
/**
 * Get playtime and last played data for a list of appids from Steam's frontend API
 * Uses window.appStore which is Steam's internal game data cache
 */
export declare const getPlaytimeData: (appids: string[]) => Promise<Record<string, GameData>>;
/**
 * Get game names for a list of appids from Steam's frontend API
 * Uses window.appStore.GetAppOverviewByAppID which has the display_name property
 * This works for ALL owned games, even uninstalled ones
 */
export declare const getGameNames: (appids: string[]) => Promise<Record<string, string>>;
/**
 * Get achievement data with fallback: cache first, then API call
 * Unified function for fetching achievement data that tries cache first,
 * then falls back to calling SteamClient.Apps.GetMyAchievementsForApp
 *
 * @param appids List of appids to get achievement data for
 * @returns Map of appid -> achievement data (only includes games with achievements)
 */
export declare const getAchievementDataWithFallback: (appids: string[]) => Promise<Record<string, AchievementData>>;
/**
 * Fetch achievement data on-demand using SteamClient.Apps.GetMyAchievementsForApp
 *
 * This uses Steam's internal API that fetches achievement data from Steam servers,
 * which works even for uninstalled games or games not in the frontend cache.
 */
export declare const fetchAchievementsOnDemand: (appid: string) => Promise<AchievementData | null>;
/**
 * Sync a single game with frontend data (playtime + achievements)
 * Called when viewing a game's detail page to get latest data
 * Uses cache + API fallback for achievements
 */
export declare const syncSingleGameWithFrontendData: (appid: string) => Promise<{
    success: boolean;
    error?: string;
}>;
/**
 * Progressive sync - process one game at a time completely before moving to next
 * This provides immediate feedback and avoids long waits for achievement fetching
 */
export declare const syncLibraryProgressive: (onProgress?: (current: number, total: number, gameName?: string) => void) => Promise<SyncResult>;
export declare const syncLibraryWithFrontendData: () => Promise<SyncResult>;
