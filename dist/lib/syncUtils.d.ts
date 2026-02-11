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
    errors?: number;
    error?: string;
}
/**
 * Get achievement data for a list of appids from Steam's frontend API
 * Uses window.appAchievementProgressCache.m_achievementProgress.mapCache for full data
 */
export declare const getAchievementData: (appids: string[]) => Promise<Record<string, AchievementData>>;
/**
 * Get playtime data for a list of appids from Steam's frontend API
 * Uses window.appStore which is Steam's internal game data cache
 */
export declare const getPlaytimeData: (appids: string[]) => Promise<Record<string, number>>;
/**
 * Sync library with frontend data (playtime + achievements from Steam API)
 * This is the main sync function that should be used instead of backend-only sync
 */
/**
 * Sync a single game with frontend data (playtime + achievements)
 * Called when viewing a game's detail page to get latest data
 */
export declare const syncSingleGameWithFrontendData: (appid: string) => Promise<{
    success: boolean;
    error?: string;
}>;
export declare const syncLibraryWithFrontendData: () => Promise<SyncResult>;
