/**
 * Sync Utilities
 * Shared functions for syncing game data using Steam's frontend API
 */

import { call } from '@decky/api';

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
  new_tags?: number;  // Count of games that got new/changed tags
  errors?: number;
  error?: string;
}

/**
 * Get all owned game appids from Steam's frontend API
 * This includes both installed and uninstalled games
 * Uses SteamClient.Apps.GetAllApps() which has access to the full library
 */
export const getAllOwnedGameIds = async (): Promise<string[]> => {
  // Primary method: SteamClient.Apps.GetAllApps()
  const steamClient = (window as any).SteamClient;
  if (steamClient?.Apps?.GetAllApps) {
    try {
      const apps = await steamClient.Apps.GetAllApps();
      if (apps && apps.length > 0) {
        return apps.map((a: any) => String(a.appid || a)).filter((id: string) => parseInt(id) > 0);
      }
    } catch (e) {
      // GetAllApps failed, fall through to appStore method
    }
  }

  // Fallback: Try appStore if available
  const appStore = (window as any).appStore;
  if (!appStore) {
    return [];
  }

  // Try m_mapApps (Map of all apps)
  if (appStore.m_mapApps instanceof Map) {
    const appids = Array.from(appStore.m_mapApps.keys()).map((id: any) => String(id));
    return appids.filter((id: string) => parseInt(id) > 0);
  }

  return [];
};

/**
 * Get achievement data for a list of appids from Steam's frontend API
 * Uses window.appAchievementProgressCache.m_achievementProgress.mapCache for full data
 */
export const getAchievementData = async (appids: string[]): Promise<Record<string, AchievementData>> => {
  const achievementMap: Record<string, AchievementData> = {};

  const achievementCache = (window as any).appAchievementProgressCache;

  if (!achievementCache) {
    return achievementMap;
  }

  const mapCache = achievementCache.m_achievementProgress?.mapCache;

  if (!mapCache) {
    return achievementMap;
  }

  for (const appid of appids) {
    try {
      const entry = mapCache.get(parseInt(appid));

      if (entry && entry.total > 0) {
        achievementMap[appid] = {
          total: entry.total,
          unlocked: entry.unlocked || 0,
          percentage: entry.percentage || 0,
          all_unlocked: entry.all_unlocked || false
        };
      }
    } catch (e: any) {
    }
  }

  return achievementMap;
};

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
export const getPlaytimeData = async (appids: string[]): Promise<Record<string, GameData>> => {
  const gameDataMap: Record<string, GameData> = {};

  const appStore = (window as any).appStore;

  if (!appStore) {
    return gameDataMap;
  }

  for (const appid of appids) {
    try {
      const overview = appStore.GetAppOverviewByAppID(parseInt(appid));
      if (overview) {
        const playtime = overview.minutes_playtime_forever || 0;
        const rtLastTimePlayed = overview.rt_last_time_played || null;

        gameDataMap[appid] = {
          playtime_minutes: playtime,
          rt_last_time_played: rtLastTimePlayed
        };
      }
    } catch (e) {
    }
  }

  return gameDataMap;
};

/**
 * Get game names for a list of appids from Steam's frontend API
 * Uses window.appStore.GetAppOverviewByAppID which has the display_name property
 * This works for ALL owned games, even uninstalled ones
 */
export const getGameNames = async (appids: string[]): Promise<Record<string, string>> => {
  const nameMap: Record<string, string> = {};

  const appStore = (window as any).appStore;

  if (!appStore) {
    return nameMap;
  }

  for (const appid of appids) {
    try {
      const overview = appStore.GetAppOverviewByAppID(parseInt(appid));
      if (overview && overview.display_name) {
        nameMap[appid] = overview.display_name;
      }
    } catch (e) {
    }
  }

  return nameMap;
};

/**
 * Get achievement data with fallback: cache first, then API call
 * Unified function for fetching achievement data that tries cache first,
 * then falls back to calling SteamClient.Apps.GetMyAchievementsForApp
 *
 * @param appids List of appids to get achievement data for
 * @returns Map of appid -> achievement data (only includes games with achievements)
 */
export const getAchievementDataWithFallback = async (appids: string[]): Promise<Record<string, AchievementData>> => {
  const cacheData = await getAchievementData(appids);
  const achievementMap: Record<string, AchievementData> = { ...cacheData };

  const missingAppids = appids.filter(appid => !achievementMap[appid]);

  if (missingAppids.length === 0) {
    return achievementMap;
  }

  const steamClient = (window as any).SteamClient;
  if (!steamClient?.Apps?.GetMyAchievementsForApp) {
    return achievementMap;
  }

  for (const appid of missingAppids) {
    try {
      const promise = steamClient.Apps.GetMyAchievementsForApp(appid);

      if (promise && typeof promise.then === 'function') {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        const result = await Promise.race([promise, timeoutPromise]);

        if (result && (result as any).result === 1 && (result as any).data?.rgAchievements) {
          const achievements = (result as any).data.rgAchievements;
          const total = achievements.length;
          const unlocked = achievements.filter((a: any) => a.bAchieved).length;
          const percentage = total > 0 ? (unlocked / total) * 100 : 0;

          achievementMap[appid] = {
            total,
            unlocked,
            percentage,
            all_unlocked: total > 0 && unlocked === total
          };
        }
      }
    } catch (e: any) {
    }
  }

  return achievementMap;
};

/**
 * Fetch achievement data on-demand using SteamClient.Apps.GetMyAchievementsForApp
 *
 * This uses Steam's internal API that fetches achievement data from Steam servers,
 * which works even for uninstalled games or games not in the frontend cache.
 */
export const fetchAchievementsOnDemand = async (appid: string): Promise<AchievementData | null> => {
  const achievementCache = (window as any).appAchievementProgressCache;
  const mapCache = achievementCache?.m_achievementProgress?.mapCache;

  if (mapCache) {
    const existing = mapCache.get(parseInt(appid));
    if (existing && existing.total > 0) {
      return {
        total: existing.total,
        unlocked: existing.unlocked || 0,
        percentage: existing.percentage || 0,
        all_unlocked: existing.all_unlocked || false
      };
    }
  }

  const steamClient = (window as any).SteamClient;

  if (steamClient?.Apps?.GetMyAchievementsForApp) {
    try {
      const promise = steamClient.Apps.GetMyAchievementsForApp(appid);

      if (promise && typeof promise.then === 'function') {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        const result = await Promise.race([promise, timeoutPromise]);

        if (result && (result as any).result === 1 && (result as any).data?.rgAchievements) {
          const achievements = (result as any).data.rgAchievements;
          const total = achievements.length;
          const unlocked = achievements.filter((a: any) => a.bAchieved).length;
          const percentage = total > 0 ? (unlocked / total) * 100 : 0;

          return {
            total,
            unlocked,
            percentage,
            all_unlocked: total > 0 && unlocked === total
          };
        }
      }
    } catch (e: any) {
    }
  }

  return null;
};

/**
 * Core sync helper: sync games with frontend data
 * Unified function used by both single-game and bulk sync
 * Uses cache + API fallback for achievements
 *
 * @param appids List of appids to sync
 * @returns Sync result from backend
 */
const syncGames = async (appids: string[]): Promise<SyncResult> => {
  try {
    const gameData = await getPlaytimeData(appids);

    const achievementData = await getAchievementDataWithFallback(appids);

    const gameNames = await getGameNames(appids);

    try {
      const result = await call<[{ game_data: Record<string, GameData>; achievement_data: Record<string, AchievementData>; game_names: Record<string, string> }], SyncResult>(
        'sync_library_with_playtime',
        { game_data: gameData, achievement_data: achievementData, game_names: gameNames }
      );

      if (result && result.success) {
        return result;
      } else {
        return result || { success: false, error: 'Backend returned null or undefined' };
      }
    } catch (backendError: any) {
      throw backendError;
    }

  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown error' };
  }
};

/**
 * Sync a single game with frontend data (playtime + achievements)
 * Called when viewing a game's detail page to get latest data
 * Uses cache + API fallback for achievements
 */
export const syncSingleGameWithFrontendData = async (appid: string): Promise<{ success: boolean; error?: string }> => {
  const result = await syncGames([appid]);

  return { success: result.success, error: result.error };
};

/**
 * Progressive sync - process one game at a time completely before moving to next
 * This provides immediate feedback and avoids long waits for achievement fetching
 */
export const syncLibraryProgressive = async (
  onProgress?: (current: number, total: number, gameName?: string) => void
): Promise<SyncResult> => {
  try {
    const settingsResult = await call<[], { settings: { source_all_owned?: boolean } }>('get_settings');
    const useAllOwned = settingsResult?.settings?.source_all_owned ?? true;

    let appids: string[];

    if (useAllOwned) {
      appids = await getAllOwnedGameIds();

      let retries = 0;
      const maxRetries = 5;
      const retryDelays = [2000, 3000, 4000, 5000, 6000];

      while (appids.length === 0 && retries < maxRetries) {
        const delay = retryDelays[retries];
        retries++;

        await new Promise(resolve => setTimeout(resolve, delay));

        appids = await getAllOwnedGameIds();
      }

      if (appids.length === 0) {
        const gamesResult = await call<[], GameListResult>('get_all_games');
        if (gamesResult.success && gamesResult.games) {
          appids = gamesResult.games.map(g => g.appid);
        }
      }
    } else {
      const gamesResult = await call<[], GameListResult>('get_all_games');
      if (!gamesResult.success || !gamesResult.games) {
        return { success: false, error: gamesResult.error || 'Failed to get game list' };
      }
      appids = gamesResult.games.map(g => g.appid);
    }

    if (appids.length === 0) {
      return { success: true, total: 0, synced: 0, errors: 0 };
    }

    const total = appids.length;
    let synced = 0;
    let errors = 0;
    let newTags = 0;

    for (let i = 0; i < appids.length; i++) {
      const appid = appids[i];

      try {
        const gameData = await getPlaytimeData([appid]);
        const gameInfo = gameData[appid] || { playtime_minutes: 0, rt_last_time_played: null };

        const achievementData = await fetchAchievementsOnDemand(appid);

        const gameNames = await getGameNames([appid]);
        const gameName = gameNames[appid] || `Game ${appid}`;

        if (onProgress) {
          onProgress(i + 1, total, gameName);
        }

        const result = await call<[any], any>('sync_single_game_with_data', {
          appid,
          game_data: gameInfo,
          achievement_data: achievementData,
          game_name: gameName,
          is_bulk_sync: true,
          current_index: i + 1,
          total_count: total
        });

        if (result.success) {
          synced++;
          if (result.tag_changed) {
            newTags++;
          }
        } else {
          errors++;
        }

      } catch (e: any) {
        errors++;
      }
    }

    return {
      success: true,
      total,
      synced,
      new_tags: newTags,
      errors
    };

  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown error' };
  }
};

