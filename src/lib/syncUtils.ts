/**
 * Sync Utilities
 * Shared functions for syncing game data using Steam's frontend API
 */

import { call } from '@decky/api';

// Debug logging helper
const log = (msg: string, data?: any) => {
  const logMsg = `[GameProgressTracker][syncUtils] ${msg}`;
  if (data !== undefined) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
};

/**
 * Log to backend (for debugging without CEF)
 */
const logToBackend = async (level: 'info' | 'error' | 'warn', message: string) => {
  console.log(`[GameProgressTracker] ${message}`);
  try {
    await call<[{ level: string; message: string }], { success: boolean }>('log_frontend', { level, message });
  } catch (e) {
    // Silently fail if backend logging fails
  }
};

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
 * Game list result from backend
 */
interface GameListResult {
  success: boolean;
  games?: { appid: string; name?: string }[];
  error?: string;
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
export const getAchievementData = async (appids: string[]): Promise<Record<string, AchievementData>> => {
  log(`getAchievementData called with ${appids.length} appids`);
  const achievementMap: Record<string, AchievementData> = {};
  const defaultData: AchievementData = { total: 0, unlocked: 0, percentage: 0, all_unlocked: false };

  // Access Steam's global achievement progress cache
  const achievementCache = (window as any).appAchievementProgressCache;
  log(`appAchievementProgressCache available: ${!!achievementCache}`);

  if (!achievementCache) {
    log('appAchievementProgressCache not available - cannot get achievements!');
    return achievementMap;
  }

  // Access the mapCache which has the full achievement data
  const mapCache = achievementCache.m_achievementProgress?.mapCache;

  if (!mapCache) {
    log('mapCache not available in achievementCache');
    return achievementMap;
  }

  log(`mapCache available, size: ${mapCache.size}`);

  let successCount = 0;
  let withAchievements = 0;
  const sampleLogs: string[] = [];

  for (const appid of appids) {
    try {
      const entry = mapCache.get(parseInt(appid));

      if (entry) {
        // entry has: { appid, unlocked, total, percentage, all_unlocked, cache_time, vetted }
        achievementMap[appid] = {
          total: entry.total || 0,
          unlocked: entry.unlocked || 0,
          percentage: entry.percentage || 0,
          all_unlocked: entry.all_unlocked || false
        };
        successCount++;
        if (entry.total > 0) withAchievements++;

        if (sampleLogs.length < 5) {
          sampleLogs.push(`appid ${appid}: ${entry.unlocked}/${entry.total} (${entry.percentage.toFixed(1)}%)`);
        }
      } else {
        achievementMap[appid] = { ...defaultData };
      }
    } catch (e: any) {
      achievementMap[appid] = { ...defaultData };
    }
  }

  // Log results
  for (const logMsg of sampleLogs) {
    log(`Achievement sample - ${logMsg}`);
  }
  log(`getAchievementData: found ${successCount} entries, ${withAchievements} with achievements`);

  return achievementMap;
};

/**
 * Get playtime data for a list of appids from Steam's frontend API
 * Uses window.appStore which is Steam's internal game data cache
 */
export const getPlaytimeData = async (appids: string[]): Promise<Record<string, number>> => {
  log(`getPlaytimeData called with ${appids.length} appids`);
  const playtimeMap: Record<string, number> = {};

  // Access Steam's global appStore
  const appStore = (window as any).appStore;
  log(`appStore available: ${!!appStore}`);

  if (!appStore) {
    log('appStore not available - cannot get playtime!');
    return playtimeMap;
  }

  log(`GetAppOverviewByAppID exists: ${typeof appStore.GetAppOverviewByAppID}`);

  let successCount = 0;
  let failCount = 0;
  let withPlaytime = 0;
  const sampleLogs: string[] = [];

  for (const appid of appids) {
    try {
      const overview = appStore.GetAppOverviewByAppID(parseInt(appid));
      if (overview) {
        const playtime = overview.minutes_playtime_forever || 0;
        playtimeMap[appid] = playtime;
        successCount++;
        if (playtime > 0) withPlaytime++;

        if (sampleLogs.length < 3) {
          sampleLogs.push(`appid ${appid}: playtime=${playtime}min, name=${overview.display_name || 'unknown'}`);
        }
      } else {
        failCount++;
      }
    } catch (e) {
      failCount++;
    }
  }

  // Log results
  for (const logMsg of sampleLogs) {
    log(`Playtime sample - ${logMsg}`);
  }
  log(`getPlaytimeData results: success=${successCount}, failed=${failCount}, withPlaytime=${withPlaytime}`);

  return playtimeMap;
};

/**
 * Sync library with frontend data (playtime + achievements from Steam API)
 * This is the main sync function that should be used instead of backend-only sync
 */
/**
 * Sync a single game with frontend data (playtime + achievements)
 * Called when viewing a game's detail page to get latest data
 */
export const syncSingleGameWithFrontendData = async (appid: string): Promise<{ success: boolean; error?: string }> => {
  log(`Syncing single game: ${appid}`);

  try {
    // Get playtime from Steam frontend API
    const playtimeData = await getPlaytimeData([appid]);
    const playtime = playtimeData[appid] || 0;

    // Get achievements from Steam frontend API
    const achievementData = await getAchievementData([appid]);
    const achievements = achievementData[appid] || { total: 0, unlocked: 0, percentage: 0, all_unlocked: false };

    log(`Game ${appid}: playtime=${playtime}min, achievements=${achievements.unlocked}/${achievements.total} (${achievements.percentage.toFixed(1)}%)`);

    // Send to backend for processing
    const result = await call<[{ playtime_data: Record<string, number>; achievement_data: Record<string, AchievementData> }], SyncResult>(
      'sync_library_with_playtime',
      {
        playtime_data: { [appid]: playtime },
        achievement_data: { [appid]: achievements }
      }
    );

    log(`Single game sync complete: success=${result.success}`);
    return { success: result.success, error: result.error };

  } catch (e: any) {
    log(`Single game sync failed: ${e?.message}`);
    return { success: false, error: e?.message || 'Unknown error' };
  }
};

export const syncLibraryWithFrontendData = async (): Promise<SyncResult> => {
  log('Starting sync with frontend data...');

  try {
    // Step 1: Get game list from backend
    log('Step 1: Getting game list from backend...');
    const gamesResult = await call<[], GameListResult>('get_all_games');

    if (!gamesResult.success || !gamesResult.games) {
      log('Failed to get game list:', gamesResult.error);
      return { success: false, error: gamesResult.error || 'Failed to get game list' };
    }

    const appids = gamesResult.games.map(g => g.appid);
    log(`Got ${appids.length} games from backend`);

    // Step 2: Get playtime from Steam frontend API
    log('Step 2: Getting playtime data...');
    const playtimeData = await getPlaytimeData(appids);
    const gamesWithPlaytime = Object.values(playtimeData).filter(v => v > 0).length;
    log(`Got playtime for ${gamesWithPlaytime}/${appids.length} games`);

    // Step 3: Get achievements from Steam frontend API
    log('Step 3: Getting achievement data...');
    const achievementData = await getAchievementData(appids);
    const gamesWithAchievements = Object.values(achievementData).filter(v => v.total > 0).length;
    log(`Got achievements for ${gamesWithAchievements}/${appids.length} games`);

    // Step 4: Send to backend for processing
    log('Step 4: Sending to backend for sync...');
    const result = await call<[{ playtime_data: Record<string, number>; achievement_data: Record<string, AchievementData> }], SyncResult>(
      'sync_library_with_playtime',
      { playtime_data: playtimeData, achievement_data: achievementData }
    );

    log(`Sync complete: ${result.synced}/${result.total} games, ${result.errors || 0} errors`);
    return result;

  } catch (e: any) {
    log('Sync failed with exception:', e);
    return { success: false, error: e?.message || 'Unknown error' };
  }
};
