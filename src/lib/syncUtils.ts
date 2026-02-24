/**
 * Sync Utilities
 * Shared functions for syncing game data using Steam's frontend API
 */

import { call } from '@decky/api';

// Debug logging helper
const log = (msg: string, data?: any) => {
  const logMsg = `[DeckProgressTracker][syncUtils] ${msg}`;
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
  console.log(`[DeckProgressTracker] ${message}`);
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
  new_tags?: number;  // Count of games that got new/changed tags
  errors?: number;
  error?: string;
}

/**
 * Get all owned game appids from Steam's frontend API
 * This includes both installed and uninstalled games
 * Uses window.appStore which has access to the full library
 */
export const getAllOwnedGameIds = async (): Promise<string[]> => {
  log('getAllOwnedGameIds: Discovering all owned games from Steam frontend...');

  const appStore = (window as any).appStore;

  if (!appStore) {
    log('❌ appStore not available - window.appStore is undefined/null');
    log('This is likely because Steam frontend hasn\'t fully initialized yet');
    return [];
  }

  log('✅ appStore is available');

  // Log available properties for debugging
  const appStoreKeys = Object.keys(appStore);
  log(`appStore has ${appStoreKeys.length} properties`);
  if (appStoreKeys.length > 0) {
    log('appStore keys (first 20):', appStoreKeys.slice(0, 20).join(', '));
  }

  // Also log prototype methods
  try {
    const protoKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(appStore));
    log(`appStore prototype has ${protoKeys.length} methods`);
    if (protoKeys.length > 0) {
      log('appStore prototype methods (first 30):', protoKeys.slice(0, 30).join(', '));
    }
  } catch (e) {
    log('Could not get appStore prototype');
  }

  // Try multiple known patterns for Steam's internal app storage
  // Pattern 1: m_mapApps (Map of all apps)
  log('Pattern 1: Checking m_mapApps...');
  if (appStore.m_mapApps) {
    log(`m_mapApps exists, type: ${typeof appStore.m_mapApps}, isMap: ${appStore.m_mapApps instanceof Map}`);
    if (appStore.m_mapApps instanceof Map) {
      const appids = Array.from(appStore.m_mapApps.keys()).map((id: any) => String(id));
      log(`✅ Found ${appids.length} games via m_mapApps Map`);
      return appids.filter((id: string) => parseInt(id) > 0);
    }
  } else {
    log('m_mapApps not found');
  }

  // Pattern 2: allApps property
  log('Pattern 2: Checking allApps...');
  if (appStore.allApps) {
    log(`allApps exists, type: ${typeof appStore.allApps}, isMap: ${appStore.allApps instanceof Map}, isArray: ${Array.isArray(appStore.allApps)}`);
    if (appStore.allApps instanceof Map) {
      const appids = Array.from(appStore.allApps.keys()).map((id: any) => String(id));
      log(`✅ Found ${appids.length} games via allApps Map`);
      return appids.filter((id: string) => parseInt(id) > 0);
    }
    if (Array.isArray(appStore.allApps)) {
      const appids = appStore.allApps.map((app: any) => String(app.appid || app.app_id || app));
      log(`✅ Found ${appids.length} games via allApps Array`);
      return appids.filter((id: string) => parseInt(id) > 0);
    }
  } else {
    log('allApps not found');
  }

  // Pattern 3: m_apps object
  log('Pattern 3: Checking m_apps...');
  if (appStore.m_apps && typeof appStore.m_apps === 'object') {
    log(`m_apps exists, type: ${typeof appStore.m_apps}, isMap: ${appStore.m_apps instanceof Map}`);
    if (appStore.m_apps instanceof Map) {
      const appids = Array.from(appStore.m_apps.keys()).map((id: any) => String(id));
      log(`✅ Found ${appids.length} games via m_apps Map`);
      return appids.filter((id: string) => parseInt(id) > 0);
    }
    const appids = Object.keys(appStore.m_apps);
    log(`✅ Found ${appids.length} games via m_apps Object`);
    return appids.filter((id: string) => parseInt(id) > 0);
  } else {
    log('m_apps not found');
  }

  // Pattern 4: Try GetAllAppOverviews method (common Steam pattern)
  log('Pattern 4: Checking GetAllAppOverviews method...');
  if (typeof appStore.GetAllAppOverviews === 'function') {
    try {
      const overviews = appStore.GetAllAppOverviews();
      log(`GetAllAppOverviews returned: ${typeof overviews}, isArray: ${Array.isArray(overviews)}`);
      if (Array.isArray(overviews)) {
        const appids = overviews.map((o: any) => String(o.appid || o.app_id || o.nAppID));
        log(`✅ Found ${appids.length} games via GetAllAppOverviews`);
        return appids.filter((id: string) => parseInt(id) > 0);
      }
    } catch (e) {
      log('GetAllAppOverviews failed:', e);
    }
  } else {
    log('GetAllAppOverviews method not found');
  }

  // Pattern 5: Try iterating appStore.GetAppOverviewByAppID with known appids
  // This won't work for discovery, but let's check what methods exist

  // Pattern 6: Try collectionStore
  const collectionStore = (window as any).collectionStore;
  if (collectionStore) {
    const collectionKeys = Object.keys(collectionStore);
    log('collectionStore keys:', collectionKeys.join(', '));

    // Try GetUserOwnedApps method
    if (typeof collectionStore.GetUserOwnedApps === 'function') {
      try {
        const apps = collectionStore.GetUserOwnedApps();
        if (apps && apps.length > 0) {
          log(`Found ${apps.length} games via GetUserOwnedApps`);
          return apps.map((id: any) => String(id)).filter((id: string) => parseInt(id) > 0);
        }
      } catch (e) {
        log('GetUserOwnedApps failed:', e);
      }
    }

    // Try ownedAppsCollection
    if (collectionStore.ownedAppsCollection) {
      const apps = Array.isArray(collectionStore.ownedAppsCollection)
        ? collectionStore.ownedAppsCollection
        : Array.from(collectionStore.ownedAppsCollection);
      log(`Found ${apps.length} games via ownedAppsCollection`);
      return apps.map((id: any) => String(id)).filter((id: string) => parseInt(id) > 0);
    }

    // Try allGamesCollection
    if (collectionStore.allGamesCollection) {
      const apps = Array.isArray(collectionStore.allGamesCollection)
        ? collectionStore.allGamesCollection
        : Array.from(collectionStore.allGamesCollection);
      log(`Found ${apps.length} games via allGamesCollection`);
      return apps.map((id: any) => String(id)).filter((id: string) => parseInt(id) > 0);
    }

    // Try userCollections
    if (collectionStore.userCollections) {
      log('userCollections keys:', Object.keys(collectionStore.userCollections).join(', '));
    }

    // Try allAppsCollection
    if (collectionStore.allAppsCollection) {
      try {
        const apps = Array.isArray(collectionStore.allAppsCollection)
          ? collectionStore.allAppsCollection
          : (collectionStore.allAppsCollection.apps || Array.from(collectionStore.allAppsCollection));
        if (apps && apps.length > 0) {
          log(`Found ${apps.length} games via allAppsCollection`);
          return apps.map((id: any) => String(id.appid || id)).filter((id: string) => parseInt(id) > 0);
        }
      } catch (e) {
        log('allAppsCollection access failed:', e);
      }
    }
  }

  // Pattern 7: Try SteamClient global
  const steamClient = (window as any).SteamClient;
  if (steamClient) {
    log('SteamClient available, checking for apps...');
    if (steamClient.Apps) {
      const appsKeys = Object.keys(steamClient.Apps);
      log('SteamClient.Apps keys:', appsKeys.slice(0, 20).join(', '));

      if (typeof steamClient.Apps.GetAllApps === 'function') {
        try {
          const apps = await steamClient.Apps.GetAllApps();
          if (apps && apps.length > 0) {
            log(`Found ${apps.length} games via SteamClient.Apps.GetAllApps`);
            return apps.map((a: any) => String(a.appid || a)).filter((id: string) => parseInt(id) > 0);
          }
        } catch (e) {
          log('SteamClient.Apps.GetAllApps failed:', e);
        }
      }
    }
  }

  log('Could not discover all owned games - no matching API pattern found');
  log('Please check console output for available APIs and report to developer');
  return [];
};

/**
 * Get achievement data for a list of appids from Steam's frontend API
 * Uses window.appAchievementProgressCache.m_achievementProgress.mapCache for full data
 */
export const getAchievementData = async (appids: string[]): Promise<Record<string, AchievementData>> => {
  log(`getAchievementData called with ${appids.length} appids`);
  const achievementMap: Record<string, AchievementData> = {};
  // NOTE: We do NOT set default 0/0 data - only return entries with actual data

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

      // Only store if we have actual achievement data (total > 0)
      // Don't store 0/0 which would overwrite potentially valid data
      if (entry && entry.total > 0) {
        achievementMap[appid] = {
          total: entry.total,
          unlocked: entry.unlocked || 0,
          percentage: entry.percentage || 0,
          all_unlocked: entry.all_unlocked || false
        };
        successCount++;
        withAchievements++;

        if (sampleLogs.length < 5) {
          sampleLogs.push(`appid ${appid}: ${entry.unlocked}/${entry.total} (${entry.percentage.toFixed(1)}%)`);
        }
      }
      // If no entry or total=0, don't add to map - backend will preserve existing data
    } catch (e: any) {
      // Don't add anything on error - preserve existing data
    }
  }

  // Log results
  for (const logMsg of sampleLogs) {
    log(`Achievement sample - ${logMsg}`);
  }
  log(`getAchievementData: found ${successCount} entries with achievements`);

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
  log(`getPlaytimeData called with ${appids.length} appids`);
  const gameDataMap: Record<string, GameData> = {};

  // Access Steam's global appStore
  const appStore = (window as any).appStore;
  log(`appStore available: ${!!appStore}`);

  if (!appStore) {
    log('appStore not available - cannot get playtime!');
    return gameDataMap;
  }

  log(`GetAppOverviewByAppID exists: ${typeof appStore.GetAppOverviewByAppID}`);

  let successCount = 0;
  let failCount = 0;
  let withPlaytime = 0;
  let withLastPlayed = 0;
  const sampleLogs: string[] = [];

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

        successCount++;
        if (playtime > 0) withPlaytime++;
        if (rtLastTimePlayed) withLastPlayed++;

        if (sampleLogs.length < 3) {
          const lastPlayedStr = rtLastTimePlayed ? new Date(rtLastTimePlayed * 1000).toISOString() : 'never';
          sampleLogs.push(`appid ${appid}: playtime=${playtime}min, lastPlayed=${lastPlayedStr}, name=${overview.display_name || 'unknown'}`);
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
    log(`Game data sample - ${logMsg}`);
  }
  log(`getPlaytimeData results: success=${successCount}, failed=${failCount}, withPlaytime=${withPlaytime}, withLastPlayed=${withLastPlayed}`);

  return gameDataMap;
};

/**
 * Get game names for a list of appids from Steam's frontend API
 * Uses window.appStore.GetAppOverviewByAppID which has the display_name property
 * This works for ALL owned games, even uninstalled ones
 */
export const getGameNames = async (appids: string[]): Promise<Record<string, string>> => {
  log(`getGameNames called with ${appids.length} appids`);
  const nameMap: Record<string, string> = {};

  // Access Steam's global appStore
  const appStore = (window as any).appStore;

  if (!appStore) {
    log('appStore not available - cannot get game names!');
    return nameMap;
  }

  let successCount = 0;
  let failCount = 0;
  const sampleLogs: string[] = [];

  for (const appid of appids) {
    try {
      const overview = appStore.GetAppOverviewByAppID(parseInt(appid));
      if (overview && overview.display_name) {
        nameMap[appid] = overview.display_name;
        successCount++;

        if (sampleLogs.length < 5) {
          sampleLogs.push(`appid ${appid}: "${overview.display_name}"`);
        }
      } else {
        failCount++;
        // Don't set anything - backend will use fallback
      }
    } catch (e) {
      failCount++;
    }
  }

  // Log results
  for (const logMsg of sampleLogs) {
    log(`Game name sample - ${logMsg}`);
  }
  log(`getGameNames results: success=${successCount}, failed=${failCount}`);

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
  log(`Getting achievements for ${appids.length} games (cache + API fallback)`);

  // Step 1: Try cache first (fast path)
  const cacheData = await getAchievementData(appids);
  const achievementMap: Record<string, AchievementData> = { ...cacheData };

  // Find appids not in cache
  const missingAppids = appids.filter(appid => !achievementMap[appid]);

  if (missingAppids.length === 0) {
    log(`All ${appids.length} games found in cache`);
    return achievementMap;
  }

  log(`Cache: ${Object.keys(cacheData).length}/${appids.length}, fetching ${missingAppids.length} via API`);

  // Step 2: For missing appids, try API with 5s timeout
  const steamClient = (window as any).SteamClient;
  if (!steamClient?.Apps?.GetMyAchievementsForApp) {
    log(`API not available, returning cache data only`);
    return achievementMap;
  }

  let apiFetched = 0;
  let apiErrors = 0;

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

          apiFetched++;
          log(`${appid}: ${unlocked}/${total} (${percentage.toFixed(1)}%)`);
        }
      }
    } catch (e: any) {
      apiErrors++;
      // Continue to next appid
    }
  }

  log(`API fetch complete: ${apiFetched} success, ${apiErrors} errors`);
  return achievementMap;
};

/**
 * Fetch achievement data on-demand using SteamClient.Apps.GetMyAchievementsForApp
 *
 * This uses Steam's internal API that fetches achievement data from Steam servers,
 * which works even for uninstalled games or games not in the frontend cache.
 */
export const fetchAchievementsOnDemand = async (appid: string): Promise<AchievementData | null> => {
  log(`Fetching achievements on-demand for ${appid}`);

  // First check if already in cache (fastest path)
  const achievementCache = (window as any).appAchievementProgressCache;
  const mapCache = achievementCache?.m_achievementProgress?.mapCache;

  if (mapCache) {
    const existing = mapCache.get(parseInt(appid));
    if (existing && existing.total > 0) {
      log(`${appid}: found in cache (${existing.unlocked}/${existing.total})`);
      return {
        total: existing.total,
        unlocked: existing.unlocked || 0,
        percentage: existing.percentage || 0,
        all_unlocked: existing.all_unlocked || false
      };
    }
  }

  // Try SteamClient.Apps.GetMyAchievementsForApp with timeout
  const steamClient = (window as any).SteamClient;

  if (steamClient?.Apps?.GetMyAchievementsForApp) {
    try {
      // IMPORTANT: Must pass appid as STRING (not number) for API to work
      const promise = steamClient.Apps.GetMyAchievementsForApp(appid);

      if (promise && typeof promise.then === 'function') {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        const result = await Promise.race([promise, timeoutPromise]);

        // Check for result structure: { result: 1, data: { rgAchievements: [...] } }
        if (result && (result as any).result === 1 && (result as any).data?.rgAchievements) {
          const achievements = (result as any).data.rgAchievements;
          const total = achievements.length;
          const unlocked = achievements.filter((a: any) => a.bAchieved).length;
          const percentage = total > 0 ? (unlocked / total) * 100 : 0;

          log(`${appid}: fetched via API (${unlocked}/${total})`);

          return {
            total,
            unlocked,
            percentage,
            all_unlocked: total > 0 && unlocked === total
          };
        }
      }
    } catch (e: any) {
      log(`${appid}: API fetch failed - ${e?.message}`);
    }
  }

  // Return null so backend can try Steam Web API
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
  log(`Syncing ${appids.length} games`);

  try {
    // Step 1: Get playtime and last played data
    const gameData = await getPlaytimeData(appids);
    const withPlaytime = Object.values(gameData).filter(v => v.playtime_minutes > 0).length;
    const withLastPlayed = Object.values(gameData).filter(v => v.rt_last_time_played !== null).length;
    log(`Game data: ${withPlaytime}/${appids.length} with playtime, ${withLastPlayed}/${appids.length} with last played`);

    // Step 2: Get achievement data (cache + API fallback)
    const achievementData = await getAchievementDataWithFallback(appids);
    const withAchievements = Object.keys(achievementData).length;
    log(`Achievements: ${withAchievements}/${appids.length} games`);

    // Step 3: Get game names
    const gameNames = await getGameNames(appids);
    log(`Names: ${Object.keys(gameNames).length}/${appids.length} games`);

    // Step 4: Send to backend
    log('Sending sync data to backend...');
    log(`Payload size: gameData=${Object.keys(gameData).length}, achievements=${Object.keys(achievementData).length}, names=${Object.keys(gameNames).length}`);

    try {
      const result = await call<[{ game_data: Record<string, GameData>; achievement_data: Record<string, AchievementData>; game_names: Record<string, string> }], SyncResult>(
        'sync_library_with_playtime',
        { game_data: gameData, achievement_data: achievementData, game_names: gameNames }
      );

      log('Backend call completed');
      log(`Result from backend: success=${result?.success}, total=${result?.total}, synced=${result?.synced}, errors=${result?.errors}`);

      if (result && result.success) {
        log(`✅ Sync complete: ${result.synced}/${result.total} games, ${result.errors || 0} errors`);
        return result;
      } else {
        log(`❌ Sync failed: Backend returned success=false`);
        log(`Error from backend: ${result?.error || 'No error message'}`);
        return result || { success: false, error: 'Backend returned null or undefined' };
      }
    } catch (backendError: any) {
      log(`❌ Backend call threw an error: ${backendError?.message || backendError}`);
      log(`Error stack: ${backendError?.stack}`);
      throw backendError; // Re-throw to be caught by outer try-catch
    }

  } catch (e: any) {
    log(`❌ Sync failed: ${e?.message || e}`);
    log(`Error type: ${typeof e}, Error: ${JSON.stringify(e)}`);
    return { success: false, error: e?.message || 'Unknown error' };
  }
};

/**
 * Sync a single game with frontend data (playtime + achievements)
 * Called when viewing a game's detail page to get latest data
 * Uses cache + API fallback for achievements
 */
export const syncSingleGameWithFrontendData = async (appid: string): Promise<{ success: boolean; error?: string }> => {
  log(`Syncing single game: ${appid}`);

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
  log('Starting progressive library sync');

  try {
    // Get settings
    const settingsResult = await call<[], { settings: { source_all_owned?: boolean } }>('get_settings');
    const useAllOwned = settingsResult?.settings?.source_all_owned ?? true;
    log(`Source: ${useAllOwned ? 'all owned games' : 'installed only'}`);

    // Get game list
    let appids: string[];

    if (useAllOwned) {
      // Try to discover games from frontend with retries if appStore isn't ready
      appids = await getAllOwnedGameIds();
      log(`Initial discovery attempt: ${appids.length} owned games found`);

      // Retry up to 5 times with progressive delays if discovery fails (appStore not ready on initial load)
      let retries = 0;
      const maxRetries = 5;
      const retryDelays = [2000, 3000, 4000, 5000, 6000]; // Progressive delays

      while (appids.length === 0 && retries < maxRetries) {
        const delay = retryDelays[retries];
        retries++;
        log(`Discovery failed (Steam frontend may not be ready yet)`);
        log(`Retry ${retries}/${maxRetries} in ${delay/1000}s...`);
        log(`Current state: window.appStore=${!!(window as any).appStore}, window.collectionStore=${!!(window as any).collectionStore}`);

        await new Promise(resolve => setTimeout(resolve, delay));

        log(`Attempting retry ${retries}...`);
        appids = await getAllOwnedGameIds();
        log(`Retry ${retries} result: ${appids.length} owned games discovered`);
      }

      // Final fallback to backend if discovery still fails after retries
      if (appids.length === 0) {
        log('⚠️ Frontend discovery failed after all retries');
        log('Falling back to backend game list (installed games only)');
        const gamesResult = await call<[], GameListResult>('get_all_games');
        if (gamesResult.success && gamesResult.games) {
          appids = gamesResult.games.map(g => g.appid);
          log(`Backend fallback: ${appids.length} installed games`);
          log('Note: This will only sync installed games, not your full library');
        }
      } else {
        log(`✅ Successfully discovered ${appids.length} games from Steam frontend`);
      }
    } else {
      const gamesResult = await call<[], GameListResult>('get_all_games');
      if (!gamesResult.success || !gamesResult.games) {
        return { success: false, error: gamesResult.error || 'Failed to get game list' };
      }
      appids = gamesResult.games.map(g => g.appid);
      log(`Backend: ${appids.length} games`);
    }

    if (appids.length === 0) {
      log('No games found');
      return { success: true, total: 0, synced: 0, errors: 0 };
    }

    const total = appids.length;
    let synced = 0;
    let errors = 0;
    let newTags = 0;

    log(`Starting progressive sync of ${total} games`);

    // Process each game one at a time
    for (let i = 0; i < appids.length; i++) {
      const appid = appids[i];

      try {
        // Step 1: Fetch playtime for this game
        const gameData = await getPlaytimeData([appid]);
        const gameInfo = gameData[appid] || { playtime_minutes: 0, rt_last_time_played: null };

        // Step 2: Fetch achievements for this game (with on-demand fallback)
        const achievementData = await fetchAchievementsOnDemand(appid);

        // Step 3: Fetch game name
        const gameNames = await getGameNames([appid]);
        const gameName = gameNames[appid] || `Game ${appid}`;

        // Log progress
        log(`[${i + 1}/${total}] Processing: ${gameName} (${appid})`);

        // Update UI progress callback if provided
        if (onProgress) {
          onProgress(i + 1, total, gameName);
        }

        // Step 4: Send this single game to backend for processing
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
          log(`[${i + 1}/${total}] ✅ Synced: ${gameName}`);
        } else {
          errors++;
          log(`[${i + 1}/${total}] ❌ Failed: ${gameName} - ${result.error}`);
        }

      } catch (e: any) {
        errors++;
        log(`[${i + 1}/${total}] ❌ Error processing ${appid}: ${e?.message}`);
      }
    }

    log(`✅ Progressive sync complete: ${synced}/${total} games, ${newTags} new tags, ${errors} errors`);

    return {
      success: true,
      total,
      synced,
      new_tags: newTags,
      errors
    };

  } catch (e: any) {
    log(`Progressive sync failed: ${e?.message}`);
    return { success: false, error: e?.message || 'Unknown error' };
  }
};

export const syncLibraryWithFrontendData = async (): Promise<SyncResult> => {
  log('Starting library sync');

  try {
    // Get settings
    const settingsResult = await call<[], { settings: { source_all_owned?: boolean } }>('get_settings');
    const useAllOwned = settingsResult?.settings?.source_all_owned ?? true;
    log(`Source: ${useAllOwned ? 'all owned games' : 'installed only'}`);

    // Get game list
    let appids: string[];

    if (useAllOwned) {
      // Try to discover games from frontend with retries if appStore isn't ready
      appids = await getAllOwnedGameIds();
      log(`Initial discovery attempt: ${appids.length} owned games found`);

      // Retry up to 5 times with progressive delays if discovery fails (appStore not ready on initial load)
      let retries = 0;
      const maxRetries = 5;
      const retryDelays = [2000, 3000, 4000, 5000, 6000]; // Progressive delays

      while (appids.length === 0 && retries < maxRetries) {
        const delay = retryDelays[retries];
        retries++;
        log(`Discovery failed (Steam frontend may not be ready yet)`);
        log(`Retry ${retries}/${maxRetries} in ${delay/1000}s...`);
        log(`Current state: window.appStore=${!!(window as any).appStore}, window.collectionStore=${!!(window as any).collectionStore}`);

        await new Promise(resolve => setTimeout(resolve, delay));

        log(`Attempting retry ${retries}...`);
        appids = await getAllOwnedGameIds();
        log(`Retry ${retries} result: ${appids.length} owned games discovered`);
      }

      // Final fallback to backend if discovery still fails after retries
      if (appids.length === 0) {
        log('⚠️ Frontend discovery failed after all retries');
        log('Falling back to backend game list (installed games only)');
        const gamesResult = await call<[], GameListResult>('get_all_games');
        if (gamesResult.success && gamesResult.games) {
          appids = gamesResult.games.map(g => g.appid);
          log(`Backend fallback: ${appids.length} installed games`);
          log('Note: This will only sync installed games, not your full library');
        }
      } else {
        log(`✅ Successfully discovered ${appids.length} games from Steam frontend`);
      }
    } else {
      const gamesResult = await call<[], GameListResult>('get_all_games');
      if (!gamesResult.success || !gamesResult.games) {
        return { success: false, error: gamesResult.error || 'Failed to get game list' };
      }
      appids = gamesResult.games.map(g => g.appid);
      log(`Backend: ${appids.length} games`);
    }

    if (appids.length === 0) {
      log('No games found');
      return { success: true, total: 0, synced: 0, errors: 0 };
    }

    // Use syncGames helper (cache + API fallback)
    return await syncGames(appids);

  } catch (e: any) {
    log(`Library sync failed: ${e?.message}`);
    return { success: false, error: e?.message || 'Unknown error' };
  }
};
