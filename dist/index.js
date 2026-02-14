const manifest = {"name":"Game Progress Tracker","author":"Maron","version":"1.3.5","api_version":1,"flags":["_root"],"publish":{"tags":["library","achievements","statistics","enhancement"],"description":"Automatic game tagging based on achievements, playtime, and completion time. Track your progress with visual badges in the Steam library.","image":"https://opengraph.githubassets.com/1/SteamDeckHomebrew/decky-loader"}};
const API_VERSION = 2;
if (!manifest?.name) {
    throw new Error('[@decky/api]: Failed to find plugin manifest.');
}
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) {
    throw new Error('[@decky/api]: Failed to connect to the loader as as the loader API was not initialized. This is likely a bug in Decky Loader.');
}
let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
}
catch {
    api = internalAPIConnection.connect(1, manifest.name);
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version 1. Some features may not work.`);
}
if (api._version != API_VERSION) {
    console.warn(`[@decky/api] Requested API version ${API_VERSION} but the running loader only supports version ${api._version}. Some features may not work.`);
}
const call = api.call;
const routerHook = api.routerHook;
const toaster = api.toaster;
const definePlugin = (fn) => {
    return (...args) => {
        return fn(...args);
    };
};

// Tag colors matching the existing theme
const TAG_ICON_COLORS = {
    mastered: '#f5576c',
    completed: '#38ef7d',
    in_progress: '#764ba2',
    backlog: '#888',
    dropped: '#c9a171', // Beige/tan color for dropped games
};
/**
 * Trophy icon for Mastered (100% achievements)
 */
const TrophyIcon = ({ size, color }) => (SP_REACT.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none" },
    SP_REACT.createElement("path", { d: "M12 17c-1.1 0-2-.9-2-2v-1h4v1c0 1.1-.9 2-2 2z", fill: color }),
    SP_REACT.createElement("path", { d: "M17 4h-1V3c0-.55-.45-1-1-1H9c-.55 0-1 .45-1 1v1H7c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V17H9c-.55 0-1 .45-1 1v2c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2c0-.55-.45-1-1-1h-1.5v-2.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 11.63 21 9.55 21 7V6c0-1.1-.9-2-2-2h-2zm-10 3V6h2v3c0 1.48.81 2.77 2 3.46-.43-.09-.87-.16-1.31-.27C7.36 11.36 5 9.42 5 7zm14 0c0 2.42-2.36 4.36-4.69 5.19-.44.11-.88.18-1.31.27 1.19-.69 2-1.98 2-3.46V6h2v1z", fill: color })));
/**
 * Checkmark in circle for Completed (beat main story)
 */
const CheckCircleIcon = ({ size, color }) => (SP_REACT.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none" },
    SP_REACT.createElement("circle", { cx: "12", cy: "12", r: "10", stroke: color, strokeWidth: "2", fill: "none" }),
    SP_REACT.createElement("path", { d: "M8 12l3 3 5-6", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })));
/**
 * Clock/hourglass icon for In Progress
 */
const ClockIcon = ({ size, color }) => (SP_REACT.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none" },
    SP_REACT.createElement("circle", { cx: "12", cy: "12", r: "10", stroke: color, strokeWidth: "2", fill: "none" }),
    SP_REACT.createElement("path", { d: "M12 6v6l4 2", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })));
/**
 * Empty circle for Backlog (not started)
 */
const EmptyCircleIcon = ({ size, color }) => (SP_REACT.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none" },
    SP_REACT.createElement("circle", { cx: "12", cy: "12", r: "10", stroke: color, strokeWidth: "2", fill: "none" })));
/**
 * X in circle for Dropped (abandoned)
 */
const XCircleIcon = ({ size, color }) => (SP_REACT.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none" },
    SP_REACT.createElement("circle", { cx: "12", cy: "12", r: "10", stroke: color, strokeWidth: "2", fill: "none" }),
    SP_REACT.createElement("path", { d: "M15 9l-6 6M9 9l6 6", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" })));
/**
 * TagIcon component - displays appropriate icon based on tag type
 */
const TagIcon = ({ type, size = 24, className }) => {
    if (!type)
        return null;
    const color = TAG_ICON_COLORS[type] || TAG_ICON_COLORS.backlog;
    const iconStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    };
    return (SP_REACT.createElement("span", { style: iconStyle, className: className },
        type === 'mastered' && SP_REACT.createElement(TrophyIcon, { size: size, color: color }),
        type === 'completed' && SP_REACT.createElement(CheckCircleIcon, { size: size, color: color }),
        type === 'in_progress' && SP_REACT.createElement(ClockIcon, { size: size, color: color }),
        type === 'backlog' && SP_REACT.createElement(EmptyCircleIcon, { size: size, color: color }),
        type === 'dropped' && SP_REACT.createElement(XCircleIcon, { size: size, color: color })));
};

/**
 * Sync Utilities
 * Shared functions for syncing game data using Steam's frontend API
 */
// Debug logging helper
const log$7 = (msg, data) => {
    const logMsg = `[GameProgressTracker][syncUtils] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
/**
 * Get all owned game appids from Steam's frontend API
 * This includes both installed and uninstalled games
 * Uses window.appStore which has access to the full library
 */
const getAllOwnedGameIds = async () => {
    log$7('getAllOwnedGameIds: Discovering all owned games from Steam frontend...');
    const appStore = window.appStore;
    if (!appStore) {
        log$7('appStore not available');
        return [];
    }
    // Log available properties for debugging
    const appStoreKeys = Object.keys(appStore);
    log$7('appStore keys:', appStoreKeys.join(', '));
    // Also log prototype methods
    try {
        const protoKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(appStore));
        log$7('appStore prototype methods:', protoKeys.slice(0, 30).join(', '));
    }
    catch (e) {
        log$7('Could not get appStore prototype');
    }
    // Try multiple known patterns for Steam's internal app storage
    // Pattern 1: m_mapApps (Map of all apps)
    if (appStore.m_mapApps instanceof Map) {
        const appids = Array.from(appStore.m_mapApps.keys()).map((id) => String(id));
        log$7(`Found ${appids.length} games via m_mapApps Map`);
        return appids.filter((id) => parseInt(id) > 0);
    }
    // Pattern 2: allApps property
    if (appStore.allApps) {
        if (appStore.allApps instanceof Map) {
            const appids = Array.from(appStore.allApps.keys()).map((id) => String(id));
            log$7(`Found ${appids.length} games via allApps Map`);
            return appids.filter((id) => parseInt(id) > 0);
        }
        if (Array.isArray(appStore.allApps)) {
            const appids = appStore.allApps.map((app) => String(app.appid || app.app_id || app));
            log$7(`Found ${appids.length} games via allApps Array`);
            return appids.filter((id) => parseInt(id) > 0);
        }
    }
    // Pattern 3: m_apps object
    if (appStore.m_apps && typeof appStore.m_apps === 'object') {
        if (appStore.m_apps instanceof Map) {
            const appids = Array.from(appStore.m_apps.keys()).map((id) => String(id));
            log$7(`Found ${appids.length} games via m_apps Map`);
            return appids.filter((id) => parseInt(id) > 0);
        }
        const appids = Object.keys(appStore.m_apps);
        log$7(`Found ${appids.length} games via m_apps Object`);
        return appids.filter((id) => parseInt(id) > 0);
    }
    // Pattern 4: Try GetAllAppOverviews method (common Steam pattern)
    if (typeof appStore.GetAllAppOverviews === 'function') {
        try {
            const overviews = appStore.GetAllAppOverviews();
            if (Array.isArray(overviews)) {
                const appids = overviews.map((o) => String(o.appid || o.app_id || o.nAppID));
                log$7(`Found ${appids.length} games via GetAllAppOverviews`);
                return appids.filter((id) => parseInt(id) > 0);
            }
        }
        catch (e) {
            log$7('GetAllAppOverviews failed:', e);
        }
    }
    // Pattern 5: Try iterating appStore.GetAppOverviewByAppID with known appids
    // This won't work for discovery, but let's check what methods exist
    // Pattern 6: Try collectionStore
    const collectionStore = window.collectionStore;
    if (collectionStore) {
        const collectionKeys = Object.keys(collectionStore);
        log$7('collectionStore keys:', collectionKeys.join(', '));
        // Try GetUserOwnedApps method
        if (typeof collectionStore.GetUserOwnedApps === 'function') {
            try {
                const apps = collectionStore.GetUserOwnedApps();
                if (apps && apps.length > 0) {
                    log$7(`Found ${apps.length} games via GetUserOwnedApps`);
                    return apps.map((id) => String(id)).filter((id) => parseInt(id) > 0);
                }
            }
            catch (e) {
                log$7('GetUserOwnedApps failed:', e);
            }
        }
        // Try ownedAppsCollection
        if (collectionStore.ownedAppsCollection) {
            const apps = Array.isArray(collectionStore.ownedAppsCollection)
                ? collectionStore.ownedAppsCollection
                : Array.from(collectionStore.ownedAppsCollection);
            log$7(`Found ${apps.length} games via ownedAppsCollection`);
            return apps.map((id) => String(id)).filter((id) => parseInt(id) > 0);
        }
        // Try allGamesCollection
        if (collectionStore.allGamesCollection) {
            const apps = Array.isArray(collectionStore.allGamesCollection)
                ? collectionStore.allGamesCollection
                : Array.from(collectionStore.allGamesCollection);
            log$7(`Found ${apps.length} games via allGamesCollection`);
            return apps.map((id) => String(id)).filter((id) => parseInt(id) > 0);
        }
        // Try userCollections
        if (collectionStore.userCollections) {
            log$7('userCollections keys:', Object.keys(collectionStore.userCollections).join(', '));
        }
        // Try allAppsCollection
        if (collectionStore.allAppsCollection) {
            try {
                const apps = Array.isArray(collectionStore.allAppsCollection)
                    ? collectionStore.allAppsCollection
                    : (collectionStore.allAppsCollection.apps || Array.from(collectionStore.allAppsCollection));
                if (apps && apps.length > 0) {
                    log$7(`Found ${apps.length} games via allAppsCollection`);
                    return apps.map((id) => String(id.appid || id)).filter((id) => parseInt(id) > 0);
                }
            }
            catch (e) {
                log$7('allAppsCollection access failed:', e);
            }
        }
    }
    // Pattern 7: Try SteamClient global
    const steamClient = window.SteamClient;
    if (steamClient) {
        log$7('SteamClient available, checking for apps...');
        if (steamClient.Apps) {
            const appsKeys = Object.keys(steamClient.Apps);
            log$7('SteamClient.Apps keys:', appsKeys.slice(0, 20).join(', '));
            if (typeof steamClient.Apps.GetAllApps === 'function') {
                try {
                    const apps = await steamClient.Apps.GetAllApps();
                    if (apps && apps.length > 0) {
                        log$7(`Found ${apps.length} games via SteamClient.Apps.GetAllApps`);
                        return apps.map((a) => String(a.appid || a)).filter((id) => parseInt(id) > 0);
                    }
                }
                catch (e) {
                    log$7('SteamClient.Apps.GetAllApps failed:', e);
                }
            }
        }
    }
    log$7('Could not discover all owned games - no matching API pattern found');
    log$7('Please check console output for available APIs and report to developer');
    return [];
};
/**
 * Get achievement data for a list of appids from Steam's frontend API
 * Uses window.appAchievementProgressCache.m_achievementProgress.mapCache for full data
 */
const getAchievementData = async (appids) => {
    log$7(`getAchievementData called with ${appids.length} appids`);
    const achievementMap = {};
    // NOTE: We do NOT set default 0/0 data - only return entries with actual data
    // Access Steam's global achievement progress cache
    const achievementCache = window.appAchievementProgressCache;
    log$7(`appAchievementProgressCache available: ${!!achievementCache}`);
    if (!achievementCache) {
        log$7('appAchievementProgressCache not available - cannot get achievements!');
        return achievementMap;
    }
    // Access the mapCache which has the full achievement data
    const mapCache = achievementCache.m_achievementProgress?.mapCache;
    if (!mapCache) {
        log$7('mapCache not available in achievementCache');
        return achievementMap;
    }
    log$7(`mapCache available, size: ${mapCache.size}`);
    let successCount = 0;
    const sampleLogs = [];
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
                if (sampleLogs.length < 5) {
                    sampleLogs.push(`appid ${appid}: ${entry.unlocked}/${entry.total} (${entry.percentage.toFixed(1)}%)`);
                }
            }
            // If no entry or total=0, don't add to map - backend will preserve existing data
        }
        catch (e) {
            // Don't add anything on error - preserve existing data
        }
    }
    // Log results
    for (const logMsg of sampleLogs) {
        log$7(`Achievement sample - ${logMsg}`);
    }
    log$7(`getAchievementData: found ${successCount} entries with achievements`);
    return achievementMap;
};
/**
 * Get playtime and last played data for a list of appids from Steam's frontend API
 * Uses window.appStore which is Steam's internal game data cache
 */
const getPlaytimeData = async (appids) => {
    log$7(`getPlaytimeData called with ${appids.length} appids`);
    const gameDataMap = {};
    // Access Steam's global appStore
    const appStore = window.appStore;
    log$7(`appStore available: ${!!appStore}`);
    if (!appStore) {
        log$7('appStore not available - cannot get playtime!');
        return gameDataMap;
    }
    log$7(`GetAppOverviewByAppID exists: ${typeof appStore.GetAppOverviewByAppID}`);
    let successCount = 0;
    let failCount = 0;
    let withPlaytime = 0;
    let withLastPlayed = 0;
    const sampleLogs = [];
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
                if (playtime > 0)
                    withPlaytime++;
                if (rtLastTimePlayed)
                    withLastPlayed++;
                if (sampleLogs.length < 3) {
                    const lastPlayedStr = rtLastTimePlayed ? new Date(rtLastTimePlayed * 1000).toISOString() : 'never';
                    sampleLogs.push(`appid ${appid}: playtime=${playtime}min, lastPlayed=${lastPlayedStr}, name=${overview.display_name || 'unknown'}`);
                }
            }
            else {
                failCount++;
            }
        }
        catch (e) {
            failCount++;
        }
    }
    // Log results
    for (const logMsg of sampleLogs) {
        log$7(`Game data sample - ${logMsg}`);
    }
    log$7(`getPlaytimeData results: success=${successCount}, failed=${failCount}, withPlaytime=${withPlaytime}, withLastPlayed=${withLastPlayed}`);
    return gameDataMap;
};
/**
 * Get game names for a list of appids from Steam's frontend API
 * Uses window.appStore.GetAppOverviewByAppID which has the display_name property
 * This works for ALL owned games, even uninstalled ones
 */
const getGameNames = async (appids) => {
    log$7(`getGameNames called with ${appids.length} appids`);
    const nameMap = {};
    // Access Steam's global appStore
    const appStore = window.appStore;
    if (!appStore) {
        log$7('appStore not available - cannot get game names!');
        return nameMap;
    }
    let successCount = 0;
    let failCount = 0;
    const sampleLogs = [];
    for (const appid of appids) {
        try {
            const overview = appStore.GetAppOverviewByAppID(parseInt(appid));
            if (overview && overview.display_name) {
                nameMap[appid] = overview.display_name;
                successCount++;
                if (sampleLogs.length < 5) {
                    sampleLogs.push(`appid ${appid}: "${overview.display_name}"`);
                }
            }
            else {
                failCount++;
                // Don't set anything - backend will use fallback
            }
        }
        catch (e) {
            failCount++;
        }
    }
    // Log results
    for (const logMsg of sampleLogs) {
        log$7(`Game name sample - ${logMsg}`);
    }
    log$7(`getGameNames results: success=${successCount}, failed=${failCount}`);
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
const getAchievementDataWithFallback = async (appids) => {
    log$7(`Getting achievements for ${appids.length} games (cache + API fallback)`);
    // Step 1: Try cache first (fast path)
    const cacheData = await getAchievementData(appids);
    const achievementMap = { ...cacheData };
    // Find appids not in cache
    const missingAppids = appids.filter(appid => !achievementMap[appid]);
    if (missingAppids.length === 0) {
        log$7(`All ${appids.length} games found in cache`);
        return achievementMap;
    }
    log$7(`Cache: ${Object.keys(cacheData).length}/${appids.length}, fetching ${missingAppids.length} via API`);
    // Step 2: For missing appids, try API with 5s timeout
    const steamClient = window.SteamClient;
    if (!steamClient?.Apps?.GetMyAchievementsForApp) {
        log$7(`API not available, returning cache data only`);
        return achievementMap;
    }
    let apiFetched = 0;
    let apiErrors = 0;
    for (const appid of missingAppids) {
        try {
            const promise = steamClient.Apps.GetMyAchievementsForApp(appid);
            if (promise && typeof promise.then === 'function') {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Timeout')), 5000);
                });
                const result = await Promise.race([promise, timeoutPromise]);
                if (result && result.result === 1 && result.data?.rgAchievements) {
                    const achievements = result.data.rgAchievements;
                    const total = achievements.length;
                    const unlocked = achievements.filter((a) => a.bAchieved).length;
                    const percentage = total > 0 ? (unlocked / total) * 100 : 0;
                    achievementMap[appid] = {
                        total,
                        unlocked,
                        percentage,
                        all_unlocked: total > 0 && unlocked === total
                    };
                    apiFetched++;
                    log$7(`${appid}: ${unlocked}/${total} (${percentage.toFixed(1)}%)`);
                }
            }
        }
        catch (e) {
            apiErrors++;
            // Continue to next appid
        }
    }
    log$7(`API fetch complete: ${apiFetched} success, ${apiErrors} errors`);
    return achievementMap;
};
/**
 * Core sync helper: sync games with frontend data
 * Unified function used by both single-game and bulk sync
 * Uses cache + API fallback for achievements
 *
 * @param appids List of appids to sync
 * @returns Sync result from backend
 */
const syncGames = async (appids) => {
    log$7(`Syncing ${appids.length} games`);
    try {
        // Step 1: Get playtime and last played data
        const gameData = await getPlaytimeData(appids);
        const withPlaytime = Object.values(gameData).filter(v => v.playtime_minutes > 0).length;
        const withLastPlayed = Object.values(gameData).filter(v => v.rt_last_time_played !== null).length;
        log$7(`Game data: ${withPlaytime}/${appids.length} with playtime, ${withLastPlayed}/${appids.length} with last played`);
        // Step 2: Get achievement data (cache + API fallback)
        const achievementData = await getAchievementDataWithFallback(appids);
        const withAchievements = Object.keys(achievementData).length;
        log$7(`Achievements: ${withAchievements}/${appids.length} games`);
        // Step 3: Get game names
        const gameNames = await getGameNames(appids);
        log$7(`Names: ${Object.keys(gameNames).length}/${appids.length} games`);
        // Step 4: Send to backend
        const result = await call('sync_library_with_playtime', { game_data: gameData, achievement_data: achievementData, game_names: gameNames });
        log$7(`Sync complete: ${result.synced}/${result.total} games, ${result.errors || 0} errors`);
        return result;
    }
    catch (e) {
        log$7(`Sync failed: ${e?.message}`);
        return { success: false, error: e?.message || 'Unknown error' };
    }
};
/**
 * Sync a single game with frontend data (playtime + achievements)
 * Called when viewing a game's detail page to get latest data
 * Uses cache + API fallback for achievements
 */
const syncSingleGameWithFrontendData = async (appid) => {
    log$7(`Syncing single game: ${appid}`);
    const result = await syncGames([appid]);
    return { success: result.success, error: result.error };
};
const syncLibraryWithFrontendData = async () => {
    log$7('Starting library sync');
    try {
        // Get settings
        const settingsResult = await call('get_settings');
        const useAllOwned = settingsResult?.settings?.source_all_owned ?? true;
        log$7(`Source: ${useAllOwned ? 'all owned games' : 'installed only'}`);
        // Get game list
        let appids;
        if (useAllOwned) {
            // Try to discover games from frontend with retries if appStore isn't ready
            appids = await getAllOwnedGameIds();
            log$7(`Discovered ${appids.length} owned games`);
            // Retry up to 3 times with 2 second delays if discovery fails (appStore not ready on initial load)
            let retries = 0;
            while (appids.length === 0 && retries < 3) {
                retries++;
                log$7(`Discovery failed (appStore may not be ready yet), retry ${retries}/3 in 2s...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                appids = await getAllOwnedGameIds();
                log$7(`Retry ${retries}: Discovered ${appids.length} owned games`);
            }
            // Final fallback to backend if discovery still fails after retries
            if (appids.length === 0) {
                log$7('Discovery failed after retries, using backend list');
                const gamesResult = await call('get_all_games');
                if (gamesResult.success && gamesResult.games) {
                    appids = gamesResult.games.map(g => g.appid);
                    log$7(`Backend: ${appids.length} games`);
                }
            }
        }
        else {
            const gamesResult = await call('get_all_games');
            if (!gamesResult.success || !gamesResult.games) {
                return { success: false, error: gamesResult.error || 'Failed to get game list' };
            }
            appids = gamesResult.games.map(g => g.appid);
            log$7(`Backend: ${appids.length} games`);
        }
        if (appids.length === 0) {
            log$7('No games found');
            return { success: true, total: 0, synced: 0, errors: 0 };
        }
        // Use syncGames helper (cache + API fallback)
        return await syncGames(appids);
    }
    catch (e) {
        log$7(`Library sync failed: ${e?.message}`);
        return { success: false, error: e?.message || 'Unknown error' };
    }
};

/**
 * Settings Component
 * Plugin settings and configuration panel
 */
/**
 * Log to both console and backend (for debugging without CEF)
 */
const logToBackend = async (level, message) => {
    console.log(`[GameProgressTracker] ${message}`);
    try {
        await call('log_frontend', { level, message });
    }
    catch (e) {
        // Silently fail if backend logging fails
    }
};
// Tag color mapping
const TAG_COLORS = {
    completed: '#38ef7d',
    in_progress: '#764ba2',
    mastered: '#f5576c',
    backlog: '#888',
    dropped: '#c9a171',
};
const Settings = () => {
    const [settings, setSettings] = SP_REACT.useState({
        auto_tag_enabled: true,
        mastered_multiplier: 1.5, // Deprecated, kept for compatibility
        in_progress_threshold: 30,
        cache_ttl: 7200,
        source_installed: true,
        source_non_steam: true,
        source_all_owned: true,
    });
    const [stats, setStats] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(false);
    const [syncing, setSyncing] = SP_REACT.useState(false);
    const [message, setMessage] = SP_REACT.useState(null);
    // Tagged games list state
    const [taggedGames, setTaggedGames] = SP_REACT.useState([]);
    const [backlogGames, setBacklogGames] = SP_REACT.useState([]);
    const [expandedSections, setExpandedSections] = SP_REACT.useState({
        completed: false,
        in_progress: false,
        backlog: false,
        mastered: false,
        dropped: false,
    });
    const [loadingGames, setLoadingGames] = SP_REACT.useState(false);
    const [loadingBacklog, setLoadingBacklog] = SP_REACT.useState(false);
    // Settings section state
    SP_REACT.useState(false);
    // Track previous data to avoid unnecessary re-renders (prevents UI flashing)
    const prevStatsRef = SP_REACT.useRef('');
    const prevGamesRef = SP_REACT.useRef('');
    // Smart update function that only updates UI if data changed
    const smartUpdateUI = async () => {
        try {
            // Fetch stats
            const statsResult = await call('get_tag_statistics');
            if (statsResult.success && statsResult.stats) {
                const newStatsStr = JSON.stringify(statsResult.stats);
                if (newStatsStr !== prevStatsRef.current) {
                    prevStatsRef.current = newStatsStr;
                    setStats(statsResult.stats);
                }
            }
            // Fetch games
            const gamesResult = await call('get_all_tags_with_names');
            if (gamesResult.success && gamesResult.games) {
                const newGamesStr = JSON.stringify(gamesResult.games.map(g => g.appid).sort());
                if (newGamesStr !== prevGamesRef.current) {
                    prevGamesRef.current = newGamesStr;
                    setTaggedGames(gamesResult.games);
                    // No notification here - notifications only shown after explicit sync complete
                }
            }
        }
        catch (err) {
            // Silently fail
        }
    };
    // Poll for sync progress from backend (works for both auto-sync and manual sync)
    SP_REACT.useEffect(() => {
        const pollSyncProgress = async () => {
            try {
                const result = await call('get_sync_progress');
                if (result.success && result.syncing) {
                    // Update message with current progress
                    setMessage(`Syncing: ${result.current}/${result.total} games`);
                    setSyncing(true);
                }
                else if (result.success && !result.syncing && syncing) {
                    // Sync just finished
                    setSyncing(false);
                    // Update UI to show new tags
                    smartUpdateUI();
                }
            }
            catch (err) {
                // Silently fail - backend may not support get_sync_progress yet
            }
        };
        // Poll every 500ms when syncing, less frequently otherwise
        const interval = setInterval(pollSyncProgress, syncing ? 500 : 2000);
        return () => clearInterval(interval);
    }, [syncing]);
    SP_REACT.useEffect(() => {
        loadSettings();
        // Initial load - force update
        loadStats().then(() => {
            if (stats)
                prevStatsRef.current = JSON.stringify(stats);
        });
        loadTaggedGames().then(() => {
            if (taggedGames.length > 0)
                prevGamesRef.current = JSON.stringify(taggedGames.map(g => g.appid).sort());
        });
        // Poll every 10 seconds for updates (from background sync or other sources)
        const pollInterval = setInterval(smartUpdateUI, 10000);
        return () => clearInterval(pollInterval);
    }, []);
    const loadSettings = async () => {
        try {
            const result = await call('get_settings');
            if (result.settings) {
                setSettings(result.settings);
            }
        }
        catch (err) {
            console.error('Error loading settings:', err);
        }
    };
    const loadStats = async () => {
        await logToBackend('info', 'loadStats called');
        try {
            const result = await call('get_tag_statistics');
            await logToBackend('info', `loadStats result: ${JSON.stringify(result)}`);
            if (result.success && result.stats) {
                setStats(result.stats);
            }
        }
        catch (err) {
            await logToBackend('error', `loadStats error: ${err}`);
        }
    };
    const loadTaggedGames = async () => {
        await logToBackend('info', 'loadTaggedGames called');
        try {
            setLoadingGames(true);
            const result = await call('get_all_tags_with_names');
            await logToBackend('info', `loadTaggedGames result: success=${result.success}, games=${result.games?.length || 0}`);
            if (result.success && result.games) {
                setTaggedGames(result.games);
            }
        }
        catch (err) {
            await logToBackend('error', `loadTaggedGames error: ${err}`);
        }
        finally {
            setLoadingGames(false);
        }
    };
    const loadBacklogGames = async () => {
        await logToBackend('info', 'loadBacklogGames called');
        try {
            setLoadingBacklog(true);
            const result = await call('get_backlog_games');
            await logToBackend('info', `loadBacklogGames result: success=${result.success}, games=${result.games?.length || 0}`);
            if (result.success && result.games) {
                setBacklogGames(result.games);
            }
        }
        catch (err) {
            await logToBackend('error', `loadBacklogGames error: ${err}`);
        }
        finally {
            setLoadingBacklog(false);
        }
    };
    const toggleSection = (tagType) => {
        const willExpand = !expandedSections[tagType];
        setExpandedSections(prev => ({
            ...prev,
            [tagType]: willExpand,
        }));
        // Load backlog games when expanding backlog section (and not already loaded)
        if (tagType === 'backlog' && willExpand && backlogGames.length === 0) {
            loadBacklogGames();
        }
    };
    const navigateToGame = (appid) => {
        DFL.Navigation.Navigate(`/library/app/${appid}`);
        DFL.Navigation.CloseSideMenus();
    };
    const syncLibrary = async () => {
        await logToBackend('info', '========================================');
        await logToBackend('info', `syncLibrary button clicked - v${"1.3.5"}`);
        await logToBackend('info', '========================================');
        try {
            setSyncing(true);
            setMessage('Fetching game list...');
            let appids;
            // Check if we should use all owned games from frontend or backend discovery
            if (settings.source_all_owned) {
                // Step 1: Get all owned games from Steam frontend API
                await logToBackend('info', 'Step 1: Getting ALL owned games from Steam frontend API...');
                appids = await getAllOwnedGameIds();
                await logToBackend('info', `getAllOwnedGameIds returned ${appids.length} games`);
                if (appids.length === 0) {
                    await logToBackend('warn', 'Frontend discovery returned 0 games, falling back to backend...');
                    const gamesResult = await call('get_all_games');
                    if (gamesResult.success && gamesResult.games) {
                        appids = gamesResult.games.map(g => g.appid);
                        await logToBackend('info', `Backend fallback: Got ${appids.length} games`);
                    }
                    else {
                        await logToBackend('error', `Both frontend and backend discovery failed`);
                        showMessage('Failed to discover games. Please try again.');
                        return;
                    }
                }
            }
            else {
                // Step 1: Get game appids from backend (installed games only)
                await logToBackend('info', 'Step 1: Calling backend get_all_games...');
                const gamesResult = await call('get_all_games');
                await logToBackend('info', `get_all_games response: ${JSON.stringify(gamesResult).slice(0, 500)}`);
                if (!gamesResult.success || !gamesResult.games) {
                    await logToBackend('error', `get_all_games failed: ${gamesResult.error}`);
                    showMessage(`Failed to get game list: ${gamesResult.error || 'Unknown error'}`);
                    return;
                }
                appids = gamesResult.games.map(g => g.appid);
            }
            await logToBackend('info', `Step 1 complete: Got ${appids.length} games`);
            await logToBackend('info', `First 5 appids: ${appids.slice(0, 5).join(', ')}`);
            await logToBackend('info', `Appid types: ${appids.slice(0, 5).map(a => typeof a).join(', ')}`);
            // Step 2: Get game data (playtime + last played) from Steam frontend API
            await logToBackend('info', 'Step 2: Getting game data from Steam frontend API...');
            setMessage(`Getting game data for ${appids.length} games...`);
            const gameData = await getPlaytimeData(appids);
            const gamesWithPlaytime = Object.values(gameData).filter(v => v.playtime_minutes > 0).length;
            await logToBackend('info', `Step 2 complete: Got game data for ${gamesWithPlaytime}/${appids.length} games`);
            // Log sample of game data
            const sampleEntries = Object.entries(gameData).slice(0, 5);
            await logToBackend('info', `Sample game data: ${JSON.stringify(sampleEntries)}`);
            // Step 2.5: Get achievement data from Steam frontend API
            await logToBackend('info', 'Step 2.5: Getting achievement data from Steam frontend API...');
            setMessage(`Getting achievement data for ${appids.length} games...`);
            const achievementData = await getAchievementData(appids);
            const gamesWithAchievements = Object.values(achievementData).filter(v => v.total > 0).length;
            await logToBackend('info', `Step 2.5 complete: Got achievements for ${gamesWithAchievements}/${appids.length} games`);
            // Log sample of achievement data
            const achievementSample = Object.entries(achievementData).slice(0, 5);
            await logToBackend('info', `Sample achievement data: ${JSON.stringify(achievementSample)}`);
            // Step 2.6: Get game names from Steam frontend API (works for uninstalled games too!)
            await logToBackend('info', 'Step 2.6: Getting game names from Steam frontend API...');
            setMessage(`Getting game names for ${appids.length} games...`);
            const gameNames = await getGameNames(appids);
            await logToBackend('info', `Step 2.6 complete: Got names for ${Object.keys(gameNames).length}/${appids.length} games`);
            // Step 3: Sync all games at once - backend tracks progress
            await logToBackend('info', 'Step 3: Syncing all games...');
            const result = await call('sync_library_with_playtime', { game_data: gameData, achievement_data: achievementData, game_names: gameNames });
            await logToBackend('info', `Step 3 complete: ${result.synced}/${appids.length} synced, ${result.new_tags || 0} new tags, ${result.errors || 0} errors`);
            // Update UI to show new tags
            await smartUpdateUI();
            const syncMessage = `Sync complete! ${result.synced}/${appids.length} games synced.` +
                (result.new_tags && result.new_tags > 0 ? ` ${result.new_tags} new tags.` : '') +
                (result.errors ? ` ${result.errors} errors.` : '');
            showMessage(syncMessage);
            // Show final toast notification only at the end
            toaster.toast({
                title: 'Game Progress Tracker',
                body: syncMessage,
                duration: 5000,
            });
        }
        catch (err) {
            console.error('[GameProgressTracker] Error syncing library:', err);
            showMessage(`Sync error: ${err?.message || 'Unknown error'}`);
        }
        finally {
            setSyncing(false);
        }
    };
    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 5000);
    };
    // Group tagged games by tag type
    const groupedGames = taggedGames.reduce((acc, game) => {
        if (!acc[game.tag]) {
            acc[game.tag] = [];
        }
        acc[game.tag].push(game);
        return acc;
    }, {});
    const tagLabels = {
        completed: 'Completed',
        in_progress: 'In Progress',
        backlog: 'Backlog',
        mastered: 'Mastered',
        dropped: 'Dropped',
    };
    const tagDescriptions = {
        completed: 'Beat the main story (playtime ≥ HLTB main story time)',
        in_progress: 'Currently playing (playtime ≥ 30 minutes)',
        backlog: 'Not started yet (no playtime or minimal playtime)',
        mastered: 'Unlocked 85%+ of all achievements',
        dropped: 'Not played for over 1 year',
    };
    const totalGames = stats ? stats.total : 0;
    // Get count for each category including backlog from stats
    const getCategoryCount = (tagType) => {
        if (tagType === 'backlog') {
            return stats?.backlog || 0;
        }
        return (groupedGames[tagType] || []).length;
    };
    return (SP_REACT.createElement("div", { style: styles$1.container },
        message && (SP_REACT.createElement("div", { style: styles$1.message }, message)),
        SP_REACT.createElement("div", { style: styles$1.section },
            SP_REACT.createElement("h3", { style: styles$1.sectionTitle },
                "Library (",
                totalGames,
                " games)"),
            loadingGames ? (SP_REACT.createElement("div", { style: styles$1.loadingText }, "Loading games...")) : totalGames === 0 ? (SP_REACT.createElement("div", { style: styles$1.loadingText }, "No games synced yet. Click \"Sync Entire Library\" to tag your games based on playtime and achievements.")) : (SP_REACT.createElement(DFL.Focusable, { style: styles$1.taggedListContainer, "flow-children": "down" }, ['in_progress', 'completed', 'mastered', 'dropped', 'backlog'].map((tagType) => {
                if (!tagType)
                    return null;
                const isBacklog = tagType === 'backlog';
                const games = isBacklog ? backlogGames : (groupedGames[tagType] || []);
                const count = getCategoryCount(tagType);
                const isExpanded = expandedSections[tagType];
                return (SP_REACT.createElement(DFL.Focusable, { key: tagType, style: styles$1.tagSection, "flow-children": "down" },
                    SP_REACT.createElement(DFL.Focusable, { style: styles$1.tagSectionHeader, onActivate: () => toggleSection(tagType) },
                        SP_REACT.createElement("div", { style: styles$1.tagSectionLeft },
                            SP_REACT.createElement(TagIcon, { type: tagType, size: 18 }),
                            SP_REACT.createElement("span", { style: styles$1.tagSectionTitle }, tagLabels[tagType])),
                        SP_REACT.createElement("div", { style: styles$1.tagSectionRight },
                            SP_REACT.createElement("span", { style: { ...styles$1.tagCount, color: TAG_COLORS[tagType] } }, count),
                            SP_REACT.createElement("span", { style: styles$1.expandIcon }, isExpanded ? '−' : '+'))),
                    isExpanded && (SP_REACT.createElement("div", { style: styles$1.tagDescription }, tagDescriptions[tagType])),
                    isExpanded && isBacklog && loadingBacklog && (SP_REACT.createElement("div", { style: styles$1.emptySection }, "Loading backlog games...")),
                    isExpanded && games.length > 0 && (SP_REACT.createElement(DFL.Focusable, { style: styles$1.gameList, "flow-children": "down" }, games.map((game) => (SP_REACT.createElement(DFL.Focusable, { key: game.appid, style: styles$1.gameItem, onActivate: () => navigateToGame(game.appid) },
                        SP_REACT.createElement("span", { style: {
                                ...styles$1.smallDot,
                                backgroundColor: TAG_COLORS[game.tag],
                            } }),
                        SP_REACT.createElement("span", { style: styles$1.gameName }, game.game_name),
                        game.is_manual && (SP_REACT.createElement("span", { style: styles$1.manualBadge }, "manual"))))))),
                    isExpanded && games.length === 0 && !loadingBacklog && (SP_REACT.createElement("div", { style: styles$1.emptySection }, "No games with this tag"))));
            })))),
        SP_REACT.createElement(DFL.PanelSection, null,
            SP_REACT.createElement(DFL.PanelSectionRow, null,
                SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: syncLibrary, disabled: syncing || loading }, syncing ? 'Syncing...' : 'Sync Entire Library')),
            SP_REACT.createElement("div", { style: styles$1.hint }, "Sync may take several minutes for large libraries")),
        SP_REACT.createElement("div", { style: styles$1.section },
            SP_REACT.createElement("h3", { style: styles$1.sectionTitle }, "About"),
            SP_REACT.createElement("div", { style: styles$1.about },
                SP_REACT.createElement("p", null,
                    "Game Progress Tracker ",
                    "1.3.5"),
                SP_REACT.createElement("p", null, "Automatic game tagging based on achievements, playtime, and completion time."),
                SP_REACT.createElement("p", { style: styles$1.smallText }, "Data from HowLongToBeat \u2022 Steam achievement system")))));
};
const styles$1 = {
    container: {
        padding: '16px',
        color: 'white',
    },
    message: {
        padding: '12px',
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderRadius: '4px',
        marginBottom: '16px',
        fontSize: '14px',
        border: '1px solid rgba(102, 126, 234, 0.5)',
    },
    section: {
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #333',
    },
    sectionTitle: {
        margin: '0 0 12px 0',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#aaa',
    },
    statGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '10px',
    },
    statCard: {
        backgroundColor: '#252525',
        padding: '12px 8px',
        borderRadius: '8px',
        textAlign: 'center',
    },
    statValue: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#667eea',
        marginBottom: '4px',
    },
    statLabel: {
        fontSize: '11px',
        color: '#aaa',
    },
    expandButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#333',
        border: '1px solid #444',
        borderRadius: '4px',
        color: 'white',
        fontSize: '14px',
        cursor: 'pointer',
        textAlign: 'left',
    },
    taggedListContainer: {
        marginTop: '12px',
        maxHeight: '400px',
        overflowY: 'auto',
    },
    loadingText: {
        padding: '16px',
        textAlign: 'center',
        color: '#888',
        fontSize: '14px',
    },
    tagGroup: {
        marginBottom: '16px',
    },
    tagGroupHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#ccc',
        marginBottom: '8px',
        paddingBottom: '4px',
        borderBottom: '1px solid #333',
    },
    tagDot: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        display: 'inline-block',
    },
    gameList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    gameItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: '#252525',
        borderRadius: '4px',
        transition: 'background-color 0.2s',
    },
    smallDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        flexShrink: 0,
    },
    gameName: {
        fontSize: '13px',
        color: '#ddd',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    manualBadge: {
        fontSize: '10px',
        color: '#888',
        backgroundColor: '#333',
        padding: '2px 6px',
        borderRadius: '3px',
    },
    settingsContainer: {
        marginTop: '12px',
        padding: '12px',
        backgroundColor: '#1a1a1a',
        borderRadius: '4px',
    },
    settingGroup: {
        marginBottom: '16px',
    },
    settingGroupTitle: {
        margin: '0 0 8px 0',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#888',
    },
    settingRow: {
        marginBottom: '16px',
    },
    label: {
        display: 'block',
        fontSize: '14px',
        marginBottom: '8px',
        cursor: 'pointer',
    },
    checkbox: {
        marginRight: '8px',
        cursor: 'pointer',
    },
    slider: {
        width: '100%',
        marginTop: '8px',
    },
    hint: {
        fontSize: '12px',
        color: '#888',
        marginTop: '4px',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#667eea',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginBottom: '8px',
        transition: 'background-color 0.2s',
    },
    buttonDisabled: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#555',
        border: 'none',
        borderRadius: '4px',
        color: '#aaa',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'not-allowed',
        marginBottom: '8px',
    },
    buttonSecondary: {
        width: '100%',
        padding: '10px',
        backgroundColor: '#444',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '13px',
        cursor: 'pointer',
        marginBottom: '8px',
    },
    about: {
        fontSize: '14px',
        lineHeight: '1.6',
    },
    smallText: {
        fontSize: '12px',
        color: '#888',
        marginTop: '8px',
    },
    tagRulesInfo: {
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#252525',
        borderRadius: '4px',
    },
    tagRule: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        fontSize: '13px',
    },
    tagSection: {
        marginBottom: '8px',
        backgroundColor: '#1a1a1a',
        borderRadius: '6px',
        overflow: 'hidden',
    },
    tagSectionHeader: {
        width: '100%',
        padding: '12px 14px',
        backgroundColor: '#252525',
        border: 'none',
        borderRadius: '0',
        color: 'white',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    tagSectionLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    tagSectionRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    tagSectionTitle: {
        fontWeight: 'bold',
    },
    tagCount: {
        fontSize: '16px',
        fontWeight: 'bold',
    },
    expandIcon: {
        fontSize: '18px',
        color: '#888',
        width: '20px',
        textAlign: 'center',
    },
    emptySection: {
        padding: '12px 16px',
        color: '#666',
        fontSize: '13px',
        fontStyle: 'italic',
    },
    tagDescription: {
        padding: '8px 16px 12px 16px',
        color: '#999',
        fontSize: '12px',
        fontStyle: 'italic',
        borderBottom: '1px solid #2a2a2a',
    },
};

/**
 * GameTag Component
 * Displays a colored badge with icon for game tags
 */
// Debug logging helper
const log$6 = (msg, data) => {
    const logMsg = `[GameProgressTracker][GameTag] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
const TAG_STYLES = {
    completed: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        label: 'Completed'
    },
    in_progress: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        label: 'In Progress'
    },
    mastered: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        label: 'Mastered'
    },
    dropped: {
        background: 'linear-gradient(135deg, #b8956a 0%, #c9a171 100%)',
        label: 'Dropped'
    }
};
const GameTag = ({ tag, onClick, compact = false }) => {
    log$6(`GameTag render: tag=${tag?.tag || 'null'}, compact=${compact}, hasOnClick=${!!onClick}`);
    if (!tag || !tag.tag) {
        log$6('GameTag: no tag, returning null');
        return null;
    }
    const style = TAG_STYLES[tag.tag];
    if (!style) {
        log$6(`GameTag: no style for tag=${tag.tag}, returning null`);
        return null;
    }
    log$6(`GameTag: rendering badge for tag=${tag.tag}`);
    // Compact mode: just the icon with background circle
    if (compact) {
        const compactStyle = {
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '50%',
            padding: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            zIndex: 1000,
            cursor: onClick ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
        };
        return (SP_REACT.createElement("div", { onClick: onClick, style: compactStyle, title: style.label },
            SP_REACT.createElement(TagIcon, { type: tag.tag, size: 16 })));
    }
    // Full mode: badge with icon and text
    // Note: position is relative (not absolute) - parent handles placement
    const containerStyle = {
        position: 'relative',
        display: 'inline-flex',
        background: style.background,
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        cursor: onClick ? 'pointer' : 'default',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
        transition: 'transform 0.2s ease',
    };
    return (SP_REACT.createElement("div", { onClick: onClick, style: containerStyle, title: tag.is_manual ? 'Manual tag - Click to edit' : 'Automatic tag - Click to edit' },
        SP_REACT.createElement(TagIcon, { type: tag.tag, size: 18 }),
        SP_REACT.createElement("span", null, style.label),
        tag.is_manual && (SP_REACT.createElement("span", { style: { fontSize: '12px', opacity: 0.8 } }, "\u270E"))));
};

/**
 * TagManager Component
 * Modal for managing game tags manually
 */
// Debug logging helper
const log$5 = (msg, data) => {
    const logMsg = `[GameProgressTracker][TagManager] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
const TagManager = ({ appid, onClose }) => {
    const [details, setDetails] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    log$5(`TagManager mounted for appid=${appid}`);
    SP_REACT.useEffect(() => {
        log$5(`TagManager useEffect: fetching details for appid=${appid}`);
        fetchDetails();
    }, [appid]);
    const fetchDetails = async () => {
        try {
            log$5(`fetchDetails: calling get_game_details for appid=${appid}`);
            setLoading(true);
            setError(null);
            const result = await call('get_game_details', { appid });
            log$5(`fetchDetails: result for appid=${appid}:`, result);
            setDetails(result);
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to load game details';
            setError(errorMsg);
            log$5(`fetchDetails: error for appid=${appid}: ${errorMsg}`, err);
        }
        finally {
            setLoading(false);
        }
    };
    const setTag = async (tag) => {
        try {
            log$5(`setTag: calling set_manual_tag for appid=${appid}, tag=${tag}`);
            const result = await call('set_manual_tag', { appid, tag });
            log$5(`setTag: result for appid=${appid}:`, result);
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to set tag';
            setError(errorMsg);
            log$5(`setTag: error for appid=${appid}: ${errorMsg}`, err);
        }
    };
    const resetToAuto = async () => {
        try {
            log$5(`resetToAuto: calling reset_to_auto_tag for appid=${appid}`);
            const result = await call('reset_to_auto_tag', { appid });
            log$5(`resetToAuto: result for appid=${appid}:`, result);
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to reset tag';
            setError(errorMsg);
            log$5(`resetToAuto: error for appid=${appid}: ${errorMsg}`, err);
        }
    };
    const removeTag = async () => {
        try {
            log$5(`removeTag: calling remove_tag for appid=${appid}`);
            const result = await call('remove_tag', { appid });
            log$5(`removeTag: result for appid=${appid}:`, result);
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to remove tag';
            setError(errorMsg);
            log$5(`removeTag: error for appid=${appid}: ${errorMsg}`, err);
        }
    };
    if (loading) {
        return (SP_REACT.createElement("div", { style: styles.modal },
            SP_REACT.createElement("div", { style: styles.content },
                SP_REACT.createElement("div", { style: styles.loading }, "Loading..."))));
    }
    if (error || !details || !details.success) {
        return (SP_REACT.createElement("div", { style: styles.modal },
            SP_REACT.createElement("div", { style: styles.content },
                SP_REACT.createElement("div", { style: styles.error }, error || 'Failed to load game details'),
                SP_REACT.createElement(DFL.Focusable, null,
                    SP_REACT.createElement(DFL.DialogButton, { onClick: onClose }, "Close")))));
    }
    const stats = details.stats;
    const tag = details.tag;
    const hltb = details.hltb_data;
    return (SP_REACT.createElement("div", { style: styles.modal, onClick: onClose },
        SP_REACT.createElement("div", { style: styles.content, onClick: (e) => e.stopPropagation() },
            SP_REACT.createElement("div", { style: styles.header },
                SP_REACT.createElement("h2", { style: styles.title }, stats?.game_name || `Game ${appid}`),
                tag?.tag && (SP_REACT.createElement("div", { style: styles.currentTagBadge },
                    SP_REACT.createElement(TagIcon, { type: tag.tag, size: 20 }),
                    SP_REACT.createElement("span", { style: { color: TAG_ICON_COLORS[tag.tag] } }, tag.tag.replace('_', ' ').toUpperCase()),
                    SP_REACT.createElement("span", { style: styles.tagType }, tag.is_manual ? '(Manual)' : '(Auto)')))),
            SP_REACT.createElement("div", { style: styles.mainContent },
                SP_REACT.createElement("div", { style: styles.leftColumn },
                    SP_REACT.createElement("h3", { style: styles.sectionTitle }, "Statistics"),
                    stats && (SP_REACT.createElement(SP_REACT.Fragment, null,
                        SP_REACT.createElement("div", { style: styles.statRow },
                            SP_REACT.createElement("span", null, "Playtime:"),
                            SP_REACT.createElement("span", null,
                                Math.floor(stats.playtime_minutes / 60),
                                "h ",
                                stats.playtime_minutes % 60,
                                "m")),
                        SP_REACT.createElement("div", { style: styles.statRow },
                            SP_REACT.createElement("span", null, "Achievements:"),
                            SP_REACT.createElement("span", null,
                                stats.unlocked_achievements,
                                "/",
                                stats.total_achievements)))),
                    hltb && (SP_REACT.createElement(SP_REACT.Fragment, null,
                        SP_REACT.createElement("div", { style: styles.statRow },
                            SP_REACT.createElement("span", null, "HLTB Match:"),
                            SP_REACT.createElement("span", { style: styles.hltbMatch },
                                hltb.matched_name,
                                " (",
                                Math.round((hltb.similarity || 0) * 100),
                                "%)")),
                        hltb.main_story && (SP_REACT.createElement("div", { style: styles.statRow },
                            SP_REACT.createElement("span", null, "Main Story:"),
                            SP_REACT.createElement("span", null,
                                hltb.main_story,
                                "h"))))),
                    !hltb && (SP_REACT.createElement("div", { style: styles.statRow },
                        SP_REACT.createElement("span", null, "HLTB:"),
                        SP_REACT.createElement("span", { style: styles.noData }, "No data")))),
                SP_REACT.createElement("div", { style: styles.rightColumn },
                    SP_REACT.createElement("h3", { style: styles.sectionTitle }, "Set Tag"),
                    SP_REACT.createElement(DFL.Focusable, { style: styles.tagButtonGroup, "flow-children": "down" },
                        SP_REACT.createElement(DFL.Focusable, { onActivate: () => setTag('mastered'), style: { ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.mastered } },
                            SP_REACT.createElement(TagIcon, { type: "mastered", size: 18 }),
                            SP_REACT.createElement("span", null, "Mastered")),
                        SP_REACT.createElement(DFL.Focusable, { onActivate: () => setTag('completed'), style: { ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.completed } },
                            SP_REACT.createElement(TagIcon, { type: "completed", size: 18 }),
                            SP_REACT.createElement("span", null, "Completed")),
                        SP_REACT.createElement(DFL.Focusable, { onActivate: () => setTag('in_progress'), style: { ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.in_progress } },
                            SP_REACT.createElement(TagIcon, { type: "in_progress", size: 18 }),
                            SP_REACT.createElement("span", null, "In Progress")),
                        SP_REACT.createElement(DFL.Focusable, { onActivate: () => setTag('dropped'), style: { ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.dropped } },
                            SP_REACT.createElement(TagIcon, { type: "dropped", size: 18 }),
                            SP_REACT.createElement("span", null, "Dropped"))),
                    SP_REACT.createElement(DFL.Focusable, { style: styles.buttonGroup, "flow-children": "horizontal" },
                        SP_REACT.createElement(DFL.DialogButton, { onClick: resetToAuto, style: styles.secondaryButton }, "Reset to Auto"),
                        SP_REACT.createElement(DFL.DialogButton, { onClick: removeTag, style: styles.secondaryButton }, "Remove")))),
            SP_REACT.createElement(DFL.Focusable, null,
                SP_REACT.createElement(DFL.DialogButton, { onClick: onClose, style: styles.closeButton }, "Close")))));
};
const styles = {
    modal: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '80px',
        zIndex: 10000,
    },
    content: {
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '650px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        color: 'white',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #333',
    },
    currentTagBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        backgroundColor: '#252525',
        borderRadius: '16px',
        fontSize: '13px',
        fontWeight: 'bold',
        width: 'fit-content',
    },
    title: {
        margin: 0,
        fontSize: '18px',
        fontWeight: 'bold',
    },
    mainContent: {
        display: 'flex',
        gap: '24px',
        marginBottom: '20px',
    },
    leftColumn: {
        flex: 1,
        minWidth: 0,
    },
    rightColumn: {
        flex: 1,
        minWidth: 0,
    },
    sectionTitle: {
        margin: '0 0 12px 0',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#aaa',
    },
    statRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        fontSize: '13px',
    },
    hltbMatch: {
        fontSize: '12px',
        color: '#888',
        maxWidth: '120px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    noData: {
        color: '#666',
        fontStyle: 'italic',
    },
    tagType: {
        fontSize: '11px',
        color: '#888',
        fontWeight: 'normal',
    },
    noTag: {
        color: '#888',
        fontStyle: 'italic',
    },
    buttonGroup: {
        display: 'flex',
        gap: '6px',
    },
    tagButtonGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '10px',
    },
    tagButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        fontSize: '13px',
        fontWeight: 'bold',
        transition: 'opacity 0.2s',
    },
    secondaryButton: {
        flex: 1,
        padding: '8px',
        backgroundColor: '#444',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '12px',
        transition: 'background-color 0.2s',
    },
    closeButton: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#555',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
    },
    loading: {
        textAlign: 'center',
        padding: '40px',
        fontSize: '16px',
    },
    error: {
        textAlign: 'center',
        padding: '20px',
        fontSize: '14px',
        color: '#ff6b6b',
    },
    button: {
        padding: '12px 24px',
        backgroundColor: '#667eea',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        marginTop: '12px',
    },
};

/**
 * React hook for managing game tags
 */
// Debug logging helper
const log$4 = (msg, data) => {
    const logMsg = `[GameProgressTracker][useGameTag] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
function useGameTag(appid) {
    const [tag, setTag] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    SP_REACT.useEffect(() => {
        log$4(`useEffect triggered for appid=${appid}`);
        fetchTag();
    }, [appid]);
    const fetchTag = async () => {
        try {
            log$4(`fetchTag: calling get_game_tag for appid=${appid}`);
            setLoading(true);
            setError(null);
            const result = await call('get_game_tag', { appid });
            log$4(`fetchTag: result for appid=${appid}:`, result);
            setTag(result.tag);
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to fetch tag';
            setError(errorMsg);
            log$4(`fetchTag: error for appid=${appid}: ${errorMsg}`, err);
        }
        finally {
            setLoading(false);
        }
    };
    const setManualTag = async (newTag) => {
        try {
            setError(null);
            const result = await call('set_manual_tag', { appid, tag: newTag });
            if (result.success) {
                await fetchTag();
            }
            else {
                setError(result.error || 'Failed to set tag');
            }
        }
        catch (err) {
            setError(err?.message || 'Failed to set tag');
            console.error('Error setting tag:', err);
        }
    };
    const removeTag = async () => {
        try {
            setError(null);
            const result = await call('remove_tag', { appid });
            if (result.success) {
                await fetchTag();
            }
            else {
                setError(result.error || 'Failed to remove tag');
            }
        }
        catch (err) {
            setError(err?.message || 'Failed to remove tag');
            console.error('Error removing tag:', err);
        }
    };
    const resetToAuto = async () => {
        try {
            setError(null);
            const result = await call('reset_to_auto_tag', { appid });
            if (result.success) {
                await fetchTag();
            }
            else {
                setError(result.error || 'Failed to reset tag');
            }
        }
        catch (err) {
            setError(err?.message || 'Failed to reset tag');
            console.error('Error resetting tag:', err);
        }
    };
    return {
        tag,
        loading,
        error,
        refetch: fetchTag,
        setManualTag,
        removeTag,
        resetToAuto
    };
}

/**
 * GameTagBadge Component
 * Wrapper component for displaying game tag on library app page
 * Designed to be injected via safe route patching
 * Uses same positioning pattern as ProtonDB Badges
 */
// Debug logging helper
const log$3 = (msg, data) => {
    const logMsg = `[GameProgressTracker][GameTagBadge] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
/**
 * Find the TopCapsule element by walking up the DOM tree
 * Same pattern used by ProtonDB Badges
 */
function findTopCapsuleParent(ref) {
    const children = ref?.parentElement?.children;
    if (!children) {
        return null;
    }
    // Find the Header container
    let headerContainer;
    for (const child of children) {
        if (child.className.includes(DFL.appDetailsClasses.Header)) {
            headerContainer = child;
            break;
        }
    }
    if (!headerContainer) {
        return null;
    }
    // Find TopCapsule within the header
    let topCapsule = null;
    for (const child of headerContainer.children) {
        if (child.className.includes(DFL.appDetailsHeaderClasses.TopCapsule)) {
            topCapsule = child;
            break;
        }
    }
    return topCapsule;
}
/**
 * Placeholder button when no tag exists
 */
const AddTagButton = ({ onClick }) => {
    const buttonStyle = {
        display: 'inline-flex',
        background: 'rgba(50, 50, 50, 0.9)',
        color: '#aaa',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        alignItems: 'center',
        gap: '8px',
        userSelect: 'none',
        border: '1px dashed #666',
    };
    return (SP_REACT.createElement("div", { onClick: onClick, style: buttonStyle, title: "Click to add tag" },
        SP_REACT.createElement("span", { style: { fontSize: '16px' } }, "+"),
        SP_REACT.createElement("span", null, "Add Tag")));
};
/**
 * GameTagBadge - Main component injected into library app page
 * Shows tag badge or "Add Tag" button, with TagManager modal
 * Positions on opposite side of ProtonDB (top-right vs their top-left default)
 */
const GameTagBadge = ({ appid }) => {
    const { tag, loading, error, refetch } = useGameTag(appid);
    const [showManager, setShowManager] = SP_REACT.useState(false);
    const [show, setShow] = SP_REACT.useState(true);
    const ref = SP_REACT.useRef(null);
    SP_REACT.useEffect(() => {
        log$3(`Mounted: appid=${appid}`);
        // Sync this game's data when detail page is viewed
        // This ensures we have the latest playtime and achievement data
        (async () => {
            try {
                log$3(`Syncing game data for appid=${appid}...`);
                const result = await syncSingleGameWithFrontendData(appid);
                if (result.success) {
                    log$3(`Game ${appid} synced successfully, refreshing tag...`);
                    refetch();
                }
                else {
                    log$3(`Game ${appid} sync failed: ${result.error}`);
                }
            }
            catch (e) {
                log$3(`Error syncing game ${appid}:`, e);
            }
        })();
        return () => {
            log$3(`Unmounted: appid=${appid}`);
        };
    }, [appid]);
    // Watch for fullscreen mode changes (same pattern as ProtonDB)
    SP_REACT.useEffect(() => {
        const topCapsule = findTopCapsuleParent(ref?.current);
        if (!topCapsule) {
            log$3('TopCapsule container not found');
            return;
        }
        log$3('TopCapsule found, setting up mutation observer');
        const mutationObserver = new MutationObserver((entries) => {
            for (const entry of entries) {
                if (entry.type !== 'attributes' || entry.attributeName !== 'class') {
                    continue;
                }
                const className = entry.target.className;
                const fullscreenMode = className.includes(DFL.appDetailsHeaderClasses.FullscreenEnterStart) ||
                    className.includes(DFL.appDetailsHeaderClasses.FullscreenEnterActive) ||
                    className.includes(DFL.appDetailsHeaderClasses.FullscreenEnterDone) ||
                    className.includes(DFL.appDetailsHeaderClasses.FullscreenExitStart) ||
                    className.includes(DFL.appDetailsHeaderClasses.FullscreenExitActive);
                const fullscreenAborted = className.includes(DFL.appDetailsHeaderClasses.FullscreenExitDone);
                setShow(!fullscreenMode || fullscreenAborted);
            }
        });
        mutationObserver.observe(topCapsule, { attributes: true, attributeFilter: ['class'] });
        return () => {
            mutationObserver.disconnect();
        };
    }, []);
    SP_REACT.useEffect(() => {
        log$3(`State update: appid=${appid}, loading=${loading}, tag=`, tag);
        if (error) {
            log$3(`Error: ${error}`);
        }
    }, [appid, tag, loading, error]);
    if (loading) {
        log$3(`Still loading for appid=${appid}`);
        return SP_REACT.createElement("div", { ref: ref, style: { display: 'none' } });
    }
    log$3(`Rendering: appid=${appid}, hasTag=${!!tag}, tagValue=${tag?.tag || 'none'}, show=${show}`);
    const handleClick = () => {
        log$3(`Tag button clicked for appid=${appid}`);
        setShowManager(true);
    };
    const handleClose = () => {
        log$3(`TagManager closed for appid=${appid}`);
        setShowManager(false);
        refetch();
    };
    // Position on top-right (opposite side from ProtonDB's default top-left)
    const containerStyle = {
        position: 'absolute',
        top: '50px',
        right: '20px',
        zIndex: 10,
    };
    return (SP_REACT.createElement("div", { ref: ref, style: containerStyle }, show && (SP_REACT.createElement(SP_REACT.Fragment, null,
        tag && tag.tag ? (SP_REACT.createElement(GameTag, { tag: tag, onClick: handleClick })) : (SP_REACT.createElement(AddTagButton, { onClick: handleClick })),
        showManager && (SP_REACT.createElement(TagManager, { appid: appid, onClose: handleClose }))))));
};

/**
 * Library App Route Patching
 * Based on ProtonDB Badges plugin implementation
 * Uses proper Decky UI patching utilities for safety
 */
// Debug logging helper
const log$2 = (msg, data) => {
    const logMsg = `[GameProgressTracker][patchLibraryApp] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
/**
 * Extract appid from the current route/URL
 */
function getAppIdFromUrl() {
    try {
        // Try to get appid from window location
        const match = window.location.pathname.match(/\/library\/app\/(\d+)/);
        if (match) {
            return match[1];
        }
        // Fallback: try to find it in the URL hash or other places
        const hashMatch = window.location.hash.match(/\/library\/app\/(\d+)/);
        if (hashMatch) {
            return hashMatch[1];
        }
        return null;
    }
    catch (e) {
        log$2('Error getting appid from URL:', e);
        return null;
    }
}
/**
 * Patch the library app page to inject our tag badge
 * Following the ProtonDB Badges pattern for safety
 */
function patchLibraryApp() {
    log$2('Setting up library app patch');
    return routerHook.addPatch('/library/app/:appid', (tree) => {
        log$2('Route patch callback triggered');
        try {
            // Find the route props with renderFunc (same pattern as ProtonDB)
            const routeProps = DFL.findInReactTree(tree, (x) => x?.renderFunc);
            if (routeProps) {
                log$2('Found routeProps with renderFunc');
                const patchHandler = DFL.createReactTreePatcher([
                    (tree) => DFL.findInReactTree(tree, (x) => x?.props?.children?.props?.overview)?.props?.children
                ], (_, ret) => {
                    // Find the inner container where we'll inject our badge
                    const container = DFL.findInReactTree(ret, (x) => Array.isArray(x?.props?.children) &&
                        x?.props?.className?.includes(DFL.appDetailsClasses.InnerContainer));
                    if (typeof container !== 'object') {
                        log$2('Container not found, returning original');
                        return ret;
                    }
                    // Get appid from URL since we're inside the render
                    const appid = getAppIdFromUrl();
                    if (appid) {
                        log$2(`Injecting GameTagBadge for appid=${appid}`);
                        // Inject our badge component at position 0 (first child, will use absolute positioning)
                        container.props.children.splice(0, 0, SP_REACT.createElement(GameTagBadge, { key: "game-progress-tag", appid: appid }));
                    }
                    else {
                        log$2('Could not determine appid');
                    }
                    return ret;
                });
                DFL.afterPatch(routeProps, "renderFunc", patchHandler);
                log$2('Patch handler attached to renderFunc');
            }
            else {
                log$2('routeProps with renderFunc not found');
            }
        }
        catch (error) {
            log$2('Error in route patch:', error);
        }
        return tree;
    });
}

/**
 * Achievement Cache Watcher
 * Monitors URL changes and syncs achievements when user views "Your Stuff" tab
 */
const log$1 = (msg, data) => {
    const logMsg = `[GameProgressTracker][achievementCacheWatcher] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
let lastUrl = '';
let syncTimeout = null;
/**
 * Start watching for URL changes to detect when user views achievements
 */
function startAchievementCacheWatcher() {
    log$1('Starting achievement cache watcher');
    // Poll for URL changes every 500ms
    setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            // Check if user opened "Your Stuff" tab (where achievements are shown)
            const yourStuffMatch = currentUrl.match(/\/library\/app\/(\d+)\/tab\/YourStuff/);
            if (yourStuffMatch) {
                const appid = yourStuffMatch[1];
                log$1(`Detected achievements tab for ${appid}`);
                // Clear any pending sync
                if (syncTimeout) {
                    clearTimeout(syncTimeout);
                }
                // Wait for Steam to populate the achievement cache
                // Poll the cache with exponential backoff up to 10 seconds
                syncTimeout = setTimeout(async () => {
                    const achievementCache = window.appAchievementProgressCache;
                    const mapCache = achievementCache?.m_achievementProgress?.mapCache;
                    if (!mapCache) {
                        log$1(`${appid}: mapCache not available`);
                        return;
                    }
                    // Poll with exponential backoff: 500ms, 1s, 2s, 3s, 3s (total ~10s max)
                    const delays = [500, 1000, 2000, 3000, 3000];
                    let foundData = false;
                    for (let i = 0; i < delays.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, delays[i]));
                        const entry = mapCache.get(parseInt(appid));
                        if (entry && entry.total > 0) {
                            log$1(`${appid}: Achievements loaded (${entry.unlocked}/${entry.total})`);
                            foundData = true;
                            break;
                        }
                    }
                    if (foundData) {
                        try {
                            await syncSingleGameWithFrontendData(appid);
                            log$1(`${appid}: Sync complete`);
                        }
                        catch (e) {
                            log$1(`${appid}: Sync failed - ${e.message}`);
                        }
                    }
                    else {
                        log$1(`${appid}: Achievements not loaded after 10s`);
                    }
                }, 100); // Start polling after 100ms initial delay
            }
        }
    }, 500);
}
/**
 * Stop watching for URL changes
 */
function stopAchievementCacheWatcher() {
    log$1('Stopping achievement cache watcher');
    if (syncTimeout) {
        clearTimeout(syncTimeout);
        syncTimeout = null;
    }
}

/**
 * Game Progress Tracker - Main Plugin Entry
 * Decky Loader plugin for automatic game tagging
 *
 * Uses safe route patching pattern based on ProtonDB Badges plugin
 */
// Debug logging helper
const log = (msg, data) => {
    const logMsg = `[GameProgressTracker] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
/**
 * Main Plugin Definition
 */
var index = definePlugin(() => {
    log('=== Plugin initializing ===');
    // Patch the game library page using the safe ProtonDB-style approach
    log('Setting up library app patch');
    let libraryPatch = null;
    try {
        libraryPatch = patchLibraryApp();
        log('Library app patch registered successfully');
    }
    catch (error) {
        log('Failed to register library app patch:', error);
    }
    // Start achievement cache watcher (monitors when user views "Your Stuff" tab)
    log('Starting achievement cache watcher');
    startAchievementCacheWatcher();
    // Trigger sync with frontend data (replaces backend auto-sync)
    // This uses Steam's frontend API for real-time playtime and achievement data
    log('Triggering initial sync with frontend data...');
    (async () => {
        try {
            const result = await syncLibraryWithFrontendData();
            log('Initial sync result:', result);
            // Show toast notification when initial sync completes
            // Use new_tags count from backend for accurate notification
            if (result.success && result.synced && result.synced > 0) {
                const newTags = result.new_tags || 0;
                const message = newTags > 0
                    ? `Synced ${result.synced} games. ${newTags} new tag${newTags > 1 ? 's' : ''} added!`
                    : `Synced ${result.synced} games. Open plugin to see your library.`;
                toaster.toast({
                    title: 'Game Progress Tracker',
                    body: message,
                    duration: 5000,
                });
            }
        }
        catch (err) {
            log('Initial sync failed:', err);
        }
    })();
    return {
        name: 'Game Progress Tracker',
        titleView: SP_REACT.createElement("div", { className: DFL.staticClasses.Title }, "Game Progress Tracker"),
        content: SP_REACT.createElement(Settings, null),
        icon: (SP_REACT.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: "24", height: "24" },
            SP_REACT.createElement("path", { d: "M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.87 0-7-3.13-7-7V8.3l7-3.11 7 3.11V13c0 3.87-3.13 7-7 7zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" }))),
        onDismount() {
            log('=== Plugin dismounting ===');
            // Stop achievement cache watcher
            stopAchievementCacheWatcher();
            // Clean up patches when plugin is unloaded
            if (libraryPatch) {
                try {
                    routerHook.removePatch('/library/app/:appid', libraryPatch);
                    log('Library app patch removed successfully');
                }
                catch (error) {
                    log('Error removing library app patch:', error);
                }
            }
        }
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
