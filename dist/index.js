const manifest = {"name":"Deck Progress Tracker","author":"Maron","version":"1.3.1","api_version":1,"flags":["_root"],"publish":{"tags":["library","achievements","statistics","enhancement","progress-tracking"],"description":"Automatic game tagging based on achievements, playtime, and completion time. Track your progress with visual badges in the Steam library. Features 5 intelligent tags: Mastered, Completed, Dropped, In Progress, and Backlog.","image":"https://raw.githubusercontent.com/maroun2/deck-progress-tracker/main/assets/plugin-screenshot.jpg"}};
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

var DefaultContext = {
  color: undefined,
  size: undefined,
  className: undefined,
  style: undefined,
  attr: undefined
};
var IconContext = SP_REACT.createContext && /*#__PURE__*/SP_REACT.createContext(DefaultContext);

var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } } return target; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /*#__PURE__*/SP_REACT.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return props => /*#__PURE__*/SP_REACT.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = conf => {
    var {
        attr,
        size,
        title
      } = props,
      svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /*#__PURE__*/SP_REACT.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className: className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /*#__PURE__*/SP_REACT.createElement("title", null, title), props.children);
  };
  return IconContext !== undefined ? /*#__PURE__*/SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// THIS FILE IS AUTO GENERATED
function FaTrophy (props) {
  return GenIcon({"tag":"svg","attr":{"viewBox":"0 0 576 512"},"child":[{"tag":"path","attr":{"d":"M552 64H448V24c0-13.3-10.7-24-24-24H152c-13.3 0-24 10.7-24 24v40H24C10.7 64 0 74.7 0 88v56c0 35.7 22.5 72.4 61.9 100.7 31.5 22.7 69.8 37.1 110 41.7C203.3 338.5 240 360 240 360v72h-48c-35.3 0-64 20.7-64 56v12c0 6.6 5.4 12 12 12h296c6.6 0 12-5.4 12-12v-12c0-35.3-28.7-56-64-56h-48v-72s36.7-21.5 68.1-73.6c40.3-4.6 78.6-19 110-41.7 39.3-28.3 61.9-65 61.9-100.7V88c0-13.3-10.7-24-24-24zM99.3 192.8C74.9 175.2 64 155.6 64 144v-16h64.2c1 32.6 5.8 61.2 12.8 86.2-15.1-5.2-29.2-12.4-41.7-21.4zM512 144c0 16.1-17.7 36.1-35.3 48.8-12.5 9-26.7 16.2-41.8 21.4 7-25 11.8-53.6 12.8-86.2H512v16z"},"child":[]}]})(props);
}

// Tag colors matching the existing theme
const TAG_ICON_COLORS = {
    mastered: '#f5576c',
    completed: '#38ef7d',
    in_progress: '#764ba2',
    backlog: '#888',
    dropped: '#c9a171', // Beige/tan color for dropped games
};
// Note: TrophyIcon removed - now using FaTrophy from react-icons
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
        type === 'mastered' && SP_REACT.createElement(FaTrophy, { size: size, color: color }),
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
const log$9 = (msg, data) => {
    const logMsg = `[DeckProgressTracker][syncUtils] ${msg}`;
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
    log$9('getAllOwnedGameIds: Discovering all owned games from Steam frontend...');
    const appStore = window.appStore;
    if (!appStore) {
        log$9('appStore not available');
        return [];
    }
    // Log available properties for debugging
    const appStoreKeys = Object.keys(appStore);
    log$9('appStore keys:', appStoreKeys.join(', '));
    // Also log prototype methods
    try {
        const protoKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(appStore));
        log$9('appStore prototype methods:', protoKeys.slice(0, 30).join(', '));
    }
    catch (e) {
        log$9('Could not get appStore prototype');
    }
    // Try multiple known patterns for Steam's internal app storage
    // Pattern 1: m_mapApps (Map of all apps)
    if (appStore.m_mapApps instanceof Map) {
        const appids = Array.from(appStore.m_mapApps.keys()).map((id) => String(id));
        log$9(`Found ${appids.length} games via m_mapApps Map`);
        return appids.filter((id) => parseInt(id) > 0);
    }
    // Pattern 2: allApps property
    if (appStore.allApps) {
        if (appStore.allApps instanceof Map) {
            const appids = Array.from(appStore.allApps.keys()).map((id) => String(id));
            log$9(`Found ${appids.length} games via allApps Map`);
            return appids.filter((id) => parseInt(id) > 0);
        }
        if (Array.isArray(appStore.allApps)) {
            const appids = appStore.allApps.map((app) => String(app.appid || app.app_id || app));
            log$9(`Found ${appids.length} games via allApps Array`);
            return appids.filter((id) => parseInt(id) > 0);
        }
    }
    // Pattern 3: m_apps object
    if (appStore.m_apps && typeof appStore.m_apps === 'object') {
        if (appStore.m_apps instanceof Map) {
            const appids = Array.from(appStore.m_apps.keys()).map((id) => String(id));
            log$9(`Found ${appids.length} games via m_apps Map`);
            return appids.filter((id) => parseInt(id) > 0);
        }
        const appids = Object.keys(appStore.m_apps);
        log$9(`Found ${appids.length} games via m_apps Object`);
        return appids.filter((id) => parseInt(id) > 0);
    }
    // Pattern 4: Try GetAllAppOverviews method (common Steam pattern)
    if (typeof appStore.GetAllAppOverviews === 'function') {
        try {
            const overviews = appStore.GetAllAppOverviews();
            if (Array.isArray(overviews)) {
                const appids = overviews.map((o) => String(o.appid || o.app_id || o.nAppID));
                log$9(`Found ${appids.length} games via GetAllAppOverviews`);
                return appids.filter((id) => parseInt(id) > 0);
            }
        }
        catch (e) {
            log$9('GetAllAppOverviews failed:', e);
        }
    }
    // Pattern 5: Try iterating appStore.GetAppOverviewByAppID with known appids
    // This won't work for discovery, but let's check what methods exist
    // Pattern 6: Try collectionStore
    const collectionStore = window.collectionStore;
    if (collectionStore) {
        const collectionKeys = Object.keys(collectionStore);
        log$9('collectionStore keys:', collectionKeys.join(', '));
        // Try GetUserOwnedApps method
        if (typeof collectionStore.GetUserOwnedApps === 'function') {
            try {
                const apps = collectionStore.GetUserOwnedApps();
                if (apps && apps.length > 0) {
                    log$9(`Found ${apps.length} games via GetUserOwnedApps`);
                    return apps.map((id) => String(id)).filter((id) => parseInt(id) > 0);
                }
            }
            catch (e) {
                log$9('GetUserOwnedApps failed:', e);
            }
        }
        // Try ownedAppsCollection
        if (collectionStore.ownedAppsCollection) {
            const apps = Array.isArray(collectionStore.ownedAppsCollection)
                ? collectionStore.ownedAppsCollection
                : Array.from(collectionStore.ownedAppsCollection);
            log$9(`Found ${apps.length} games via ownedAppsCollection`);
            return apps.map((id) => String(id)).filter((id) => parseInt(id) > 0);
        }
        // Try allGamesCollection
        if (collectionStore.allGamesCollection) {
            const apps = Array.isArray(collectionStore.allGamesCollection)
                ? collectionStore.allGamesCollection
                : Array.from(collectionStore.allGamesCollection);
            log$9(`Found ${apps.length} games via allGamesCollection`);
            return apps.map((id) => String(id)).filter((id) => parseInt(id) > 0);
        }
        // Try userCollections
        if (collectionStore.userCollections) {
            log$9('userCollections keys:', Object.keys(collectionStore.userCollections).join(', '));
        }
        // Try allAppsCollection
        if (collectionStore.allAppsCollection) {
            try {
                const apps = Array.isArray(collectionStore.allAppsCollection)
                    ? collectionStore.allAppsCollection
                    : (collectionStore.allAppsCollection.apps || Array.from(collectionStore.allAppsCollection));
                if (apps && apps.length > 0) {
                    log$9(`Found ${apps.length} games via allAppsCollection`);
                    return apps.map((id) => String(id.appid || id)).filter((id) => parseInt(id) > 0);
                }
            }
            catch (e) {
                log$9('allAppsCollection access failed:', e);
            }
        }
    }
    // Pattern 7: Try SteamClient global
    const steamClient = window.SteamClient;
    if (steamClient) {
        log$9('SteamClient available, checking for apps...');
        if (steamClient.Apps) {
            const appsKeys = Object.keys(steamClient.Apps);
            log$9('SteamClient.Apps keys:', appsKeys.slice(0, 20).join(', '));
            if (typeof steamClient.Apps.GetAllApps === 'function') {
                try {
                    const apps = await steamClient.Apps.GetAllApps();
                    if (apps && apps.length > 0) {
                        log$9(`Found ${apps.length} games via SteamClient.Apps.GetAllApps`);
                        return apps.map((a) => String(a.appid || a)).filter((id) => parseInt(id) > 0);
                    }
                }
                catch (e) {
                    log$9('SteamClient.Apps.GetAllApps failed:', e);
                }
            }
        }
    }
    log$9('Could not discover all owned games - no matching API pattern found');
    log$9('Please check console output for available APIs and report to developer');
    return [];
};
/**
 * Get achievement data for a list of appids from Steam's frontend API
 * Uses window.appAchievementProgressCache.m_achievementProgress.mapCache for full data
 */
const getAchievementData = async (appids) => {
    log$9(`getAchievementData called with ${appids.length} appids`);
    const achievementMap = {};
    // NOTE: We do NOT set default 0/0 data - only return entries with actual data
    // Access Steam's global achievement progress cache
    const achievementCache = window.appAchievementProgressCache;
    log$9(`appAchievementProgressCache available: ${!!achievementCache}`);
    if (!achievementCache) {
        log$9('appAchievementProgressCache not available - cannot get achievements!');
        return achievementMap;
    }
    // Access the mapCache which has the full achievement data
    const mapCache = achievementCache.m_achievementProgress?.mapCache;
    if (!mapCache) {
        log$9('mapCache not available in achievementCache');
        return achievementMap;
    }
    log$9(`mapCache available, size: ${mapCache.size}`);
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
        log$9(`Achievement sample - ${logMsg}`);
    }
    log$9(`getAchievementData: found ${successCount} entries with achievements`);
    return achievementMap;
};
/**
 * Get playtime and last played data for a list of appids from Steam's frontend API
 * Uses window.appStore which is Steam's internal game data cache
 */
const getPlaytimeData = async (appids) => {
    log$9(`getPlaytimeData called with ${appids.length} appids`);
    const gameDataMap = {};
    // Access Steam's global appStore
    const appStore = window.appStore;
    log$9(`appStore available: ${!!appStore}`);
    if (!appStore) {
        log$9('appStore not available - cannot get playtime!');
        return gameDataMap;
    }
    log$9(`GetAppOverviewByAppID exists: ${typeof appStore.GetAppOverviewByAppID}`);
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
        log$9(`Game data sample - ${logMsg}`);
    }
    log$9(`getPlaytimeData results: success=${successCount}, failed=${failCount}, withPlaytime=${withPlaytime}, withLastPlayed=${withLastPlayed}`);
    return gameDataMap;
};
/**
 * Get game names for a list of appids from Steam's frontend API
 * Uses window.appStore.GetAppOverviewByAppID which has the display_name property
 * This works for ALL owned games, even uninstalled ones
 */
const getGameNames = async (appids) => {
    log$9(`getGameNames called with ${appids.length} appids`);
    const nameMap = {};
    // Access Steam's global appStore
    const appStore = window.appStore;
    if (!appStore) {
        log$9('appStore not available - cannot get game names!');
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
        log$9(`Game name sample - ${logMsg}`);
    }
    log$9(`getGameNames results: success=${successCount}, failed=${failCount}`);
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
    log$9(`Getting achievements for ${appids.length} games (cache + API fallback)`);
    // Step 1: Try cache first (fast path)
    const cacheData = await getAchievementData(appids);
    const achievementMap = { ...cacheData };
    // Find appids not in cache
    const missingAppids = appids.filter(appid => !achievementMap[appid]);
    if (missingAppids.length === 0) {
        log$9(`All ${appids.length} games found in cache`);
        return achievementMap;
    }
    log$9(`Cache: ${Object.keys(cacheData).length}/${appids.length}, fetching ${missingAppids.length} via API`);
    // Step 2: For missing appids, try API with 5s timeout
    const steamClient = window.SteamClient;
    if (!steamClient?.Apps?.GetMyAchievementsForApp) {
        log$9(`API not available, returning cache data only`);
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
                    log$9(`${appid}: ${unlocked}/${total} (${percentage.toFixed(1)}%)`);
                }
            }
        }
        catch (e) {
            apiErrors++;
            // Continue to next appid
        }
    }
    log$9(`API fetch complete: ${apiFetched} success, ${apiErrors} errors`);
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
    log$9(`Syncing ${appids.length} games`);
    try {
        // Step 1: Get playtime and last played data
        const gameData = await getPlaytimeData(appids);
        const withPlaytime = Object.values(gameData).filter(v => v.playtime_minutes > 0).length;
        const withLastPlayed = Object.values(gameData).filter(v => v.rt_last_time_played !== null).length;
        log$9(`Game data: ${withPlaytime}/${appids.length} with playtime, ${withLastPlayed}/${appids.length} with last played`);
        // Step 2: Get achievement data (cache + API fallback)
        const achievementData = await getAchievementDataWithFallback(appids);
        const withAchievements = Object.keys(achievementData).length;
        log$9(`Achievements: ${withAchievements}/${appids.length} games`);
        // Step 3: Get game names
        const gameNames = await getGameNames(appids);
        log$9(`Names: ${Object.keys(gameNames).length}/${appids.length} games`);
        // Step 4: Send to backend
        const result = await call('sync_library_with_playtime', { game_data: gameData, achievement_data: achievementData, game_names: gameNames });
        log$9(`Sync complete: ${result.synced}/${result.total} games, ${result.errors || 0} errors`);
        return result;
    }
    catch (e) {
        log$9(`Sync failed: ${e?.message}`);
        return { success: false, error: e?.message || 'Unknown error' };
    }
};
/**
 * Sync a single game with frontend data (playtime + achievements)
 * Called when viewing a game's detail page to get latest data
 * Uses cache + API fallback for achievements
 */
const syncSingleGameWithFrontendData = async (appid) => {
    log$9(`Syncing single game: ${appid}`);
    const result = await syncGames([appid]);
    return { success: result.success, error: result.error };
};
const syncLibraryWithFrontendData = async () => {
    log$9('Starting library sync');
    try {
        // Get settings
        const settingsResult = await call('get_settings');
        const useAllOwned = settingsResult?.settings?.source_all_owned ?? true;
        log$9(`Source: ${useAllOwned ? 'all owned games' : 'installed only'}`);
        // Get game list
        let appids;
        if (useAllOwned) {
            // Try to discover games from frontend with retries if appStore isn't ready
            appids = await getAllOwnedGameIds();
            log$9(`Discovered ${appids.length} owned games`);
            // Retry up to 3 times with 2 second delays if discovery fails (appStore not ready on initial load)
            let retries = 0;
            while (appids.length === 0 && retries < 3) {
                retries++;
                log$9(`Discovery failed (appStore may not be ready yet), retry ${retries}/3 in 2s...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                appids = await getAllOwnedGameIds();
                log$9(`Retry ${retries}: Discovered ${appids.length} owned games`);
            }
            // Final fallback to backend if discovery still fails after retries
            if (appids.length === 0) {
                log$9('Discovery failed after retries, using backend list');
                const gamesResult = await call('get_all_games');
                if (gamesResult.success && gamesResult.games) {
                    appids = gamesResult.games.map(g => g.appid);
                    log$9(`Backend: ${appids.length} games`);
                }
            }
        }
        else {
            const gamesResult = await call('get_all_games');
            if (!gamesResult.success || !gamesResult.games) {
                return { success: false, error: gamesResult.error || 'Failed to get game list' };
            }
            appids = gamesResult.games.map(g => g.appid);
            log$9(`Backend: ${appids.length} games`);
        }
        if (appids.length === 0) {
            log$9('No games found');
            return { success: true, total: 0, synced: 0, errors: 0 };
        }
        // Use syncGames helper (cache + API fallback)
        return await syncGames(appids);
    }
    catch (e) {
        log$9(`Library sync failed: ${e?.message}`);
        return { success: false, error: e?.message || 'Unknown error' };
    }
};

const TAG_COLORS = {
    completed: '#38ef7d',
    in_progress: '#764ba2',
    mastered: '#f5576c',
    backlog: '#888',
    dropped: '#c9a171',
};
const TAG_LABELS = {
    completed: 'Completed',
    in_progress: 'In Progress',
    backlog: 'Backlog',
    mastered: 'Mastered',
    dropped: 'Dropped',
};
const TAG_DESCRIPTIONS = {
    completed: 'Beat the main story (playtime ≥ HLTB main story time)',
    in_progress: 'Currently playing (playtime ≥ 30 minutes)',
    backlog: 'Not started yet (no playtime or minimal playtime)',
    mastered: 'Unlocked 85%+ of all achievements',
    dropped: 'Not played for over 1 year',
};
const Settings = () => {
    const [settings, setSettings] = SP_REACT.useState({
        auto_tag_enabled: true,
        mastered_multiplier: 1.5,
        in_progress_threshold: 30,
        cache_ttl: 7200,
        source_installed: true,
        source_non_steam: true,
        source_all_owned: true,
    });
    const [stats, setStats] = SP_REACT.useState(null);
    const [syncing, setSyncing] = SP_REACT.useState(false);
    const [message, setMessage] = SP_REACT.useState(null);
    const [taggedGames, setTaggedGames] = SP_REACT.useState([]);
    const [backlogGames, setBacklogGames] = SP_REACT.useState([]);
    const [expandedSections, setExpandedSections] = SP_REACT.useState({});
    SP_REACT.useState(false);
    const [loadingBacklog, setLoadingBacklog] = SP_REACT.useState(false);
    const prevStatsRef = SP_REACT.useRef('');
    const prevGamesRef = SP_REACT.useRef('');
    const containerRef = SP_REACT.useRef(null);
    const smartUpdateUI = async () => {
        try {
            const statsResult = await call('get_tag_statistics');
            if (statsResult.success && JSON.stringify(statsResult.stats) !== prevStatsRef.current) {
                prevStatsRef.current = JSON.stringify(statsResult.stats);
                setStats(statsResult.stats);
            }
            const gamesResult = await call('get_all_tags_with_names');
            if (gamesResult.success) {
                const fingerPrint = JSON.stringify(gamesResult.games.map(g => g.appid).sort());
                if (fingerPrint !== prevGamesRef.current) {
                    prevGamesRef.current = fingerPrint;
                    setTaggedGames(gamesResult.games);
                }
            }
        }
        catch (err) { }
    };
    SP_REACT.useEffect(() => {
        // Scroll to top when component mounts
        if (containerRef.current) {
            containerRef.current.scrollIntoView({ block: 'start' });
        }
        call('get_settings').then(res => res.settings && setSettings(res.settings));
        smartUpdateUI();
        const interval = setInterval(smartUpdateUI, 10000);
        return () => clearInterval(interval);
    }, []);
    SP_REACT.useEffect(() => {
        const pollSync = async () => {
            try {
                const res = await call('get_sync_progress');
                if (res.success && res.syncing) {
                    setMessage(`Syncing: ${res.current}/${res.total} games`);
                    setSyncing(true);
                }
                else if (res.success && !res.syncing && syncing) {
                    setSyncing(false);
                    smartUpdateUI();
                }
            }
            catch (err) { }
        };
        const interval = setInterval(pollSync, syncing ? 500 : 2000);
        return () => clearInterval(interval);
    }, [syncing]);
    const toggleSection = async (tagType) => {
        const willExpand = !expandedSections[tagType];
        setExpandedSections(prev => ({ ...prev, [tagType]: willExpand }));
        if (tagType === 'backlog' && willExpand && backlogGames.length === 0) {
            setLoadingBacklog(true);
            const res = await call('get_backlog_games');
            if (res.success)
                setBacklogGames(res.games);
            setLoadingBacklog(false);
        }
    };
    const syncLibrary = async () => {
        try {
            setSyncing(true);
            setMessage('Fetching game list...');
            let appids = settings.source_all_owned ? await getAllOwnedGameIds() : [];
            if (appids.length === 0) {
                const res = await call('get_all_games');
                appids = res.games?.map(g => g.appid) || [];
            }
            setMessage(`Processing ${appids.length} games...`);
            const [gameData, achievementData, gameNames] = await Promise.all([
                getPlaytimeData(appids),
                getAchievementData(appids),
                getGameNames(appids)
            ]);
            const result = await call('sync_library_with_playtime', {
                game_data: gameData, achievement_data: achievementData, game_names: gameNames
            });
            smartUpdateUI();
            const msg = `Sync complete! ${result.synced} games updated.`;
            setMessage(msg);
            toaster.toast({ title: 'Tracker', body: msg, duration: 5000 });
        }
        catch (err) {
            setMessage(`Sync error: ${err?.message || 'Unknown'}`);
        }
        finally {
            setSyncing(false);
        }
    };
    const groupedGames = taggedGames.reduce((acc, g) => {
        if (!acc[g.tag])
            acc[g.tag] = [];
        acc[g.tag].push(g);
        return acc;
    }, {});
    return (SP_REACT.createElement("div", { ref: containerRef, style: styles$1.container },
        message && SP_REACT.createElement("div", { style: styles$1.message }, message),
        SP_REACT.createElement("div", { style: styles$1.section },
            SP_REACT.createElement("h3", { style: styles$1.sectionTitle },
                "Library (",
                stats?.total || 0,
                " games)"),
            SP_REACT.createElement(DFL.PanelSection, null, ['in_progress', 'completed', 'mastered', 'dropped', 'backlog'].map(tagType => {
                const isBacklog = tagType === 'backlog';
                const games = isBacklog ? backlogGames : (groupedGames[tagType] || []);
                const count = isBacklog ? (stats?.backlog || 0) : games.length;
                const isExpanded = !!expandedSections[tagType];
                return (SP_REACT.createElement(SP_REACT.Fragment, { key: tagType },
                    SP_REACT.createElement(DFL.PanelSectionRow, null,
                        SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: () => toggleSection(tagType) },
                            SP_REACT.createElement("div", { style: styles$1.tagSectionContent },
                                SP_REACT.createElement("div", { style: styles$1.tagSectionLeft },
                                    SP_REACT.createElement(TagIcon, { type: tagType, size: 18 }),
                                    SP_REACT.createElement("span", { style: styles$1.tagSectionTitle }, TAG_LABELS[tagType])),
                                SP_REACT.createElement("div", { style: styles$1.tagSectionRight },
                                    SP_REACT.createElement("span", { style: { ...styles$1.tagCount, color: TAG_COLORS[tagType] } }, count),
                                    SP_REACT.createElement("span", { style: styles$1.expandIcon }, isExpanded ? '−' : '+'))))),
                    isExpanded && SP_REACT.createElement("div", { style: styles$1.tagDescription }, TAG_DESCRIPTIONS[tagType]),
                    isExpanded && games.length > 0 && games.map(game => (SP_REACT.createElement(DFL.PanelSectionRow, { key: game.appid },
                        SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: () => { DFL.Navigation.Navigate(`/library/app/${game.appid}`); DFL.Navigation.CloseSideMenus(); }, style: { width: '100%', overflow: 'hidden' } },
                            SP_REACT.createElement("div", { style: { display: 'table', tableLayout: 'fixed', width: '100%' } },
                                SP_REACT.createElement("div", { style: styles$1.gameItemContent },
                                    SP_REACT.createElement("span", { style: { ...styles$1.smallDot, backgroundColor: TAG_COLORS[game.tag] } }),
                                    SP_REACT.createElement("span", { style: styles$1.gameName }, game.game_name),
                                    game.is_manual && SP_REACT.createElement("span", { style: styles$1.manualBadge }, "manual"))))))),
                    isExpanded && games.length === 0 && !loadingBacklog && SP_REACT.createElement("div", { style: styles$1.emptySection }, "No games found")));
            }))),
        SP_REACT.createElement(DFL.PanelSection, null,
            SP_REACT.createElement(DFL.PanelSectionRow, null,
                SP_REACT.createElement(DFL.ButtonItem, { layout: "below", onClick: syncLibrary, disabled: syncing }, syncing ? 'Syncing...' : 'Sync Entire Library'))),
        SP_REACT.createElement("div", { style: styles$1.section },
            SP_REACT.createElement("h3", { style: styles$1.sectionTitle }, "About"),
            SP_REACT.createElement("div", { style: styles$1.about },
                SP_REACT.createElement("p", { style: styles$1.aboutLine },
                    "Game Progress Tracker v",
                    "1.3.1"),
                SP_REACT.createElement("p", { style: styles$1.aboutLine }, "Data from HowLongToBeat & Steam"),
                SP_REACT.createElement("p", { style: styles$1.donationText }, "Donations are appreciated")))));
};
const styles$1 = {
    container: { paddingTop: '16px', color: 'white', width: '100%', maxWidth: '100%', overflow: 'hidden' },
    message: { padding: '12px', backgroundColor: 'rgba(102, 126, 234, 0.2)', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', border: '1px solid rgba(102, 126, 234, 0.5)', marginLeft: '16px', marginRight: '16px' },
    section: { marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #333', width: '100%', overflow: 'hidden' },
    sectionTitle: { margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#aaa', marginLeft: '16px' },
    gameItemContent: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', overflow: 'hidden', flexFlow: 'row nowrap' },
    smallDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
    gameName: { fontSize: '13px', color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', verticalAlign: 'middle', maxWidth: 'calc(100% - 40px)', flexShrink: 1 },
    manualBadge: { fontSize: '10px', color: '#888', backgroundColor: '#333', padding: '2px 6px', borderRadius: '3px', flexShrink: 0 },
    tagSectionContent: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    tagSectionLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    tagSectionRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    tagSectionTitle: { fontWeight: 'bold' },
    tagCount: { fontSize: '16px', fontWeight: 'bold' },
    expandIcon: { fontSize: '18px', color: '#888', width: '20px', textAlign: 'center' },
    emptySection: { padding: '12px 16px', color: '#666', fontSize: '13px', fontStyle: 'italic' },
    tagDescription: { padding: '8px 16px 12px 16px', color: '#999', fontSize: '12px', fontStyle: 'italic', borderBottom: '1px solid #2a2a2a' },
    about: { fontSize: '14px', lineHeight: '1.6', marginLeft: '16px', marginRight: '16px' },
    aboutLine: { margin: '8px 0', color: '#ccc' },
    donationText: { margin: '12px 0 0 0', fontSize: '12px', color: '#888', fontStyle: 'italic' }
};

/**
 * GameTag Component
 * Displays a colored badge with icon for game tags
 */
// Debug logging helper
const log$8 = (msg, data) => {
    const logMsg = `[DeckProgressTracker][GameTag] ${msg}`;
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
    log$8(`GameTag render: tag=${tag?.tag || 'null'}, compact=${compact}, hasOnClick=${!!onClick}`);
    if (!tag || !tag.tag) {
        log$8('GameTag: no tag, returning null');
        return null;
    }
    const style = TAG_STYLES[tag.tag];
    if (!style) {
        log$8(`GameTag: no style for tag=${tag.tag}, returning null`);
        return null;
    }
    log$8(`GameTag: rendering badge for tag=${tag.tag}`);
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
const log$7 = (msg, data) => {
    const logMsg = `[DeckProgressTracker][TagManager] ${msg}`;
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
    log$7(`TagManager mounted for appid=${appid}`);
    SP_REACT.useEffect(() => {
        log$7(`TagManager useEffect: fetching details for appid=${appid}`);
        fetchDetails();
    }, [appid]);
    const fetchDetails = async () => {
        try {
            log$7(`fetchDetails: calling get_game_details for appid=${appid}`);
            setLoading(true);
            setError(null);
            const result = await call('get_game_details', { appid });
            log$7(`fetchDetails: result for appid=${appid}:`, result);
            setDetails(result);
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to load game details';
            setError(errorMsg);
            log$7(`fetchDetails: error for appid=${appid}: ${errorMsg}`, err);
        }
        finally {
            setLoading(false);
        }
    };
    const setTag = async (tag) => {
        try {
            log$7(`setTag: calling set_manual_tag for appid=${appid}, tag=${tag}`);
            const result = await call('set_manual_tag', { appid, tag });
            log$7(`setTag: result for appid=${appid}:`, result);
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to set tag';
            setError(errorMsg);
            log$7(`setTag: error for appid=${appid}: ${errorMsg}`, err);
        }
    };
    const resetToAuto = async () => {
        try {
            log$7(`resetToAuto: calling reset_to_auto_tag for appid=${appid}`);
            const result = await call('reset_to_auto_tag', { appid });
            log$7(`resetToAuto: result for appid=${appid}:`, result);
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to reset tag';
            setError(errorMsg);
            log$7(`resetToAuto: error for appid=${appid}: ${errorMsg}`, err);
        }
    };
    const removeTag = async () => {
        try {
            log$7(`removeTag: calling remove_tag for appid=${appid}`);
            const result = await call('remove_tag', { appid });
            log$7(`removeTag: result for appid=${appid}:`, result);
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to remove tag';
            setError(errorMsg);
            log$7(`removeTag: error for appid=${appid}: ${errorMsg}`, err);
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
const log$6 = (msg, data) => {
    const logMsg = `[DeckProgressTracker][useGameTag] ${msg}`;
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
        log$6(`useEffect triggered for appid=${appid}`);
        fetchTag();
    }, [appid]);
    const fetchTag = async () => {
        try {
            log$6(`fetchTag: calling get_game_tag for appid=${appid}`);
            setLoading(true);
            setError(null);
            const result = await call('get_game_tag', { appid });
            log$6(`fetchTag: result for appid=${appid}:`, result);
            setTag(result.tag);
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to fetch tag';
            setError(errorMsg);
            log$6(`fetchTag: error for appid=${appid}: ${errorMsg}`, err);
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
const log$5 = (msg, data) => {
    const logMsg = `[DeckProgressTracker][GameTagBadge] ${msg}`;
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
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
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
    for (let i = 0; i < headerContainer.children.length; i++) {
        const child = headerContainer.children[i];
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
        log$5(`Mounted: appid=${appid}`);
        // Sync this game's data when detail page is viewed
        // This ensures we have the latest playtime and achievement data
        (async () => {
            try {
                log$5(`Syncing game data for appid=${appid}...`);
                const result = await syncSingleGameWithFrontendData(appid);
                if (result.success) {
                    log$5(`Game ${appid} synced successfully, refreshing tag...`);
                    refetch();
                }
                else {
                    log$5(`Game ${appid} sync failed: ${result.error}`);
                }
            }
            catch (e) {
                log$5(`Error syncing game ${appid}:`, e);
            }
        })();
        return () => {
            log$5(`Unmounted: appid=${appid}`);
        };
    }, [appid]);
    // Watch for fullscreen mode changes (same pattern as ProtonDB)
    SP_REACT.useEffect(() => {
        const topCapsule = findTopCapsuleParent(ref?.current);
        if (!topCapsule) {
            log$5('TopCapsule container not found');
            return;
        }
        log$5('TopCapsule found, setting up mutation observer');
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
        log$5(`State update: appid=${appid}, loading=${loading}, tag=`, tag);
        if (error) {
            log$5(`Error: ${error}`);
        }
    }, [appid, tag, loading, error]);
    if (loading) {
        log$5(`Still loading for appid=${appid}`);
        return SP_REACT.createElement("div", { ref: ref, style: { display: 'none' } });
    }
    log$5(`Rendering: appid=${appid}, hasTag=${!!tag}, tagValue=${tag?.tag || 'none'}, show=${show}`);
    const handleClick = () => {
        log$5(`Tag button clicked for appid=${appid}`);
        setShowManager(true);
    };
    const handleClose = () => {
        log$5(`TagManager closed for appid=${appid}`);
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
const log$4 = (msg, data) => {
    const logMsg = `[DeckProgressTracker][patchLibraryApp] ${msg}`;
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
        log$4('Error getting appid from URL:', e);
        return null;
    }
}
/**
 * Patch the library app page to inject our tag badge
 * Following the ProtonDB Badges pattern for safety
 */
function patchLibraryApp() {
    log$4('Setting up library app patch');
    return routerHook.addPatch('/library/app/:appid', (tree) => {
        log$4('Route patch callback triggered');
        try {
            // Find the route props with renderFunc (same pattern as ProtonDB)
            const routeProps = DFL.findInReactTree(tree, (x) => x?.renderFunc);
            if (routeProps) {
                log$4('Found routeProps with renderFunc');
                const patchHandler = DFL.createReactTreePatcher([
                    (tree) => DFL.findInReactTree(tree, (x) => x?.props?.children?.props?.overview)?.props?.children
                ], (_, ret) => {
                    // Find the inner container where we'll inject our badge
                    const container = DFL.findInReactTree(ret, (x) => Array.isArray(x?.props?.children) &&
                        x?.props?.className?.includes(DFL.appDetailsClasses.InnerContainer));
                    if (typeof container !== 'object') {
                        log$4('Container not found, returning original');
                        return ret;
                    }
                    // Get appid from URL since we're inside the render
                    const appid = getAppIdFromUrl();
                    if (appid) {
                        log$4(`Injecting GameTagBadge for appid=${appid}`);
                        // Inject our badge component at position 0 (first child, will use absolute positioning)
                        container.props.children.splice(0, 0, SP_REACT.createElement(GameTagBadge, { key: "game-progress-tag", appid: appid }));
                    }
                    else {
                        log$4('Could not determine appid');
                    }
                    return ret;
                });
                DFL.afterPatch(routeProps, "renderFunc", patchHandler);
                log$4('Patch handler attached to renderFunc');
            }
            else {
                log$4('routeProps with renderFunc not found');
            }
        }
        catch (error) {
            log$4('Error in route patch:', error);
        }
        return tree;
    });
}

/**
 * LibraryTagIcon Component
 * Small overlay icon for library grid view
 * Shows simplified tag indicator on game covers
 */
// Debug logging helper
const log$3 = (msg, data) => {
    const logMsg = `[GameProgressTracker][LibraryTagIcon] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
/**
 * LibraryTagIcon - Minimal icon overlay for library grid
 * Designed to be small and unobtrusive on game covers
 */
const LibraryTagIcon = ({ appId }) => {
    const [tag, setTag] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    SP_REACT.useEffect(() => {
        // Use cached tag if available, otherwise fetch
        const fetchTag = async () => {
            try {
                // Check if we have a cached tag first
                const cachedTag = window.__gameProgressTrackerCache?.tags?.[appId];
                if (cachedTag) {
                    setTag(cachedTag);
                    setLoading(false);
                    return;
                }
                // Fetch from backend if not cached
                const result = await call('get_game_tag', { appid: appId });
                if (result.success && result.tag) {
                    setTag(result.tag);
                    // Cache for future use
                    if (!window.__gameProgressTrackerCache) {
                        window.__gameProgressTrackerCache = { tags: {} };
                    }
                    window.__gameProgressTrackerCache.tags[appId] = result.tag;
                }
            }
            catch (err) {
                log$3(`Error fetching tag for ${appId}:`, err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchTag();
    }, [appId]);
    // Don't render anything if no tag or still loading
    if (loading || !tag?.tag) {
        return null;
    }
    // Container style - positioned absolute over the game cover
    const containerStyle = {
        position: 'absolute',
        top: '4px',
        right: '4px',
        width: '28px',
        height: '28px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `2px solid ${TAG_ICON_COLORS[tag.tag] || '#666'}`,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        zIndex: 10,
        pointerEvents: 'none', // Don't interfere with clicking the game
    };
    return (SP_REACT.createElement("div", { style: containerStyle, "data-appid": appId, "data-tag": tag.tag },
        SP_REACT.createElement(TagIcon, { type: tag.tag, size: 16 })));
};
/**
 * Preload all tags for better performance
 * Call this once when the library loads
 */
async function preloadAllTags() {
    try {
        log$3('Preloading all tags for library...');
        const result = await call('get_all_tags_with_names');
        if (result.success && result.games) {
            // Initialize cache
            if (!window.__gameProgressTrackerCache) {
                window.__gameProgressTrackerCache = { tags: {} };
            }
            // Store all tags
            const cache = window.__gameProgressTrackerCache.tags;
            result.games.forEach(game => {
                cache[game.appid] = { tag: game.tag, is_manual: game.is_manual };
            });
            log$3(`Preloaded ${result.games.length} tags`);
        }
    }
    catch (err) {
        log$3('Error preloading tags:', err);
    }
}

/**
 * Library Grid Patching
 * Adds tag icons to game covers in the library grid view
 * Uses React tree patching approach (like detail pages) instead of DOM manipulation
 */
// Debug logging helper
const log$2 = (msg, data) => {
    const logMsg = `[GameProgressTracker][patchLibraryGrid] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
// Cache to track which components we've already patched
const patchedComponents = new WeakSet();
/**
 * Extract app ID from various possible props locations
 */
function getAppIdFromProps(props) {
    if (!props)
        return null;
    // Try direct appid prop
    if (props.appid) {
        return String(props.appid);
    }
    // Try data.appid (common pattern)
    if (props.data?.appid) {
        return String(props.data.appid);
    }
    // Try overview.appid
    if (props.overview?.appid) {
        return String(props.overview.appid);
    }
    // Try libraryAsset pattern
    if (props.libraryAsset?.appid) {
        return String(props.libraryAsset.appid);
    }
    // Try app.appid
    if (props.app?.appid) {
        return String(props.app.appid);
    }
    // Try children props
    if (props.children?.props?.appid) {
        return String(props.children.props.appid);
    }
    // Steam Deck specific patterns
    if (props.appId) {
        return String(props.appId);
    }
    if (props.data?.appId) {
        return String(props.data.appId);
    }
    // Check for game ID in various formats
    if (props.gameId) {
        return String(props.gameId);
    }
    if (props.game?.id) {
        return String(props.game.id);
    }
    return null;
}
/**
 * Find and patch game tiles in the React tree
 */
function findAndPatchGameTiles(tree) {
    if (!tree)
        return tree;
    try {
        // Check if current node is a game tile
        if (tree?.props) {
            const appId = getAppIdFromProps(tree.props);
            if (appId && !patchedComponents.has(tree)) {
                log$2(`Found potential game tile with appId ${appId}`);
                // Be more aggressive - patch anything with an appId
                // Don't require image confirmation since React components might not have rendered yet
                patchedComponents.add(tree);
                // Track patch count
                if (!window.__gameProgressTrackerPatchCount) {
                    window.__gameProgressTrackerPatchCount = 0;
                }
                window.__gameProgressTrackerPatchCount++;
                log$2(`Patching game tile for app ${appId} (patch #${window.__gameProgressTrackerPatchCount})`);
                // Wrap the component with our icon
                return (SP_REACT.createElement("div", { key: `gpt-${appId}`, style: { position: 'relative', display: 'contents' } },
                    tree,
                    SP_REACT.createElement(LibraryTagIcon, { appId: appId })));
            }
        }
        // Recursively process children
        if (tree?.props?.children) {
            if (Array.isArray(tree.props.children)) {
                tree.props.children = tree.props.children.map(findAndPatchGameTiles);
            }
            else {
                tree.props.children = findAndPatchGameTiles(tree.props.children);
            }
        }
        return tree;
    }
    catch (err) {
        log$2('Error in findAndPatchGameTiles:', err);
        return tree;
    }
}
/**
 * Patch library routes to add tag icons using React tree patching
 */
function patchLibraryGrid() {
    log$2('Setting up library grid patch with React tree patching');
    // Preload tags once at startup
    preloadAllTags().then(() => {
        log$2('Tags preloaded for library grid');
    }).catch(err => {
        log$2('Error preloading tags:', err);
    });
    // Patch multiple library routes
    // Note: Steam Deck uses /routes/library with tab variations
    const libraryRoutes = [
        '/routes/library',
        '/routes/library/tab/:tab', // This is what we're seeing: /routes/library/tab/GreatOnDeck
        '/routes/library/home',
        '/routes/library/collection/:collection',
        '/library/home',
        '/library/collection/:collection',
        '/library',
    ];
    const unpatchers = []; // RoutePatch type
    libraryRoutes.forEach(route => {
        log$2(`Registering patch for route: ${route}`);
        const unpatch = routerHook.addPatch(route, (routeProps) => {
            log$2(`🎯 Route patch TRIGGERED for ${route}`);
            try {
                // Find the route props with renderFunc
                const renderFuncContainer = DFL.findInReactTree(routeProps, (x) => x?.renderFunc);
                if (renderFuncContainer) {
                    log$2(`✅ Found renderFunc for ${route}`);
                    // Create a patcher that will modify the React tree
                    const patchHandler = DFL.createReactTreePatcher([
                        // Try multiple strategies to find the game components
                        (tree) => {
                            log$2(`Searching React tree for library components in ${route}`);
                            // Strategy 1: Look for grid containers
                            let found = DFL.findInReactTree(tree, (x) => {
                                if (x?.props?.className) {
                                    const className = String(x.props.className).toLowerCase();
                                    return className.includes('grid') ||
                                        className.includes('library') ||
                                        className.includes('collection') ||
                                        className.includes('gamelist') ||
                                        className.includes('appportrait');
                                }
                                return false;
                            });
                            if (found) {
                                log$2('Found container via className strategy');
                                return found;
                            }
                            // Strategy 2: Look for arrays of game components
                            found = DFL.findInReactTree(tree, (x) => {
                                if (Array.isArray(x?.props?.children) && x.props.children.length > 0) {
                                    const hasGameTiles = x.props.children.some((child) => {
                                        const appId = getAppIdFromProps(child?.props);
                                        if (appId) {
                                            log$2(`Found game tile array with app ${appId}`);
                                            return true;
                                        }
                                        return false;
                                    });
                                    return hasGameTiles;
                                }
                                return false;
                            });
                            if (found) {
                                log$2('Found container via game tile array strategy');
                                return found;
                            }
                            // Strategy 3: Just return the tree and try to patch everything
                            log$2('No specific container found, will patch entire tree');
                            return tree;
                        }
                    ], (_, ret) => {
                        if (!ret)
                            return ret;
                        log$2(`Patching React tree for ${route}`);
                        // Process the entire tree to find and patch game tiles
                        const patchedTree = findAndPatchGameTiles(ret);
                        // Count how many patches we applied
                        const patchCount = window.__gameProgressTrackerPatchCount || 0;
                        log$2(`Total patches applied so far: ${patchCount}`);
                        return patchedTree;
                    });
                    DFL.afterPatch(renderFuncContainer, "renderFunc", patchHandler);
                    log$2(`✅ Patch handler attached to renderFunc for ${route}`);
                }
                else {
                    log$2(`⚠️ No renderFunc found for ${route}, checking route structure...`);
                    // Log what we do have in routeProps
                    const propKeys = Object.keys(routeProps || {});
                    log$2(`Route props available: ${propKeys.join(', ')}`);
                    // Try different patching strategies based on what's available
                    if (routeProps?.component) {
                        log$2(`Found 'component' property, attempting component patching`);
                        const originalComponent = routeProps.component;
                        routeProps.component = function (...args) {
                            log$2(`Component render triggered for ${route}`);
                            const result = originalComponent?.apply(this, args);
                            // Try to patch the result
                            if (result) {
                                return findAndPatchGameTiles(result);
                            }
                            return result;
                        };
                    }
                    else if (routeProps?.render) {
                        log$2(`Found 'render' property, attempting render patching`);
                        const originalRender = routeProps.render;
                        routeProps.render = function (...args) {
                            log$2(`Render triggered for ${route}`);
                            const result = originalRender?.apply(this, args);
                            // Try to patch the result
                            if (result) {
                                return findAndPatchGameTiles(result);
                            }
                            return result;
                        };
                    }
                    else if (routeProps?.componentDidMount) {
                        log$2(`Found 'componentDidMount', attempting lifecycle patching`);
                        const originalDidMount = routeProps.componentDidMount;
                        routeProps.componentDidMount = function (...args) {
                            log$2(`ComponentDidMount triggered for ${route}`);
                            return originalDidMount?.apply(this, args);
                        };
                    }
                    else {
                        log$2(`⚠️ No suitable patching point found for ${route}`);
                    }
                }
            }
            catch (error) {
                log$2(`Error patching route ${route}:`, error);
            }
            return routeProps;
        });
        unpatchers.push(unpatch);
    });
    log$2(`Registered ${unpatchers.length} route patches`);
    // Return cleanup function
    return () => {
        log$2('Removing library grid patches');
        unpatchers.forEach(unpatch => unpatch());
        // WeakSet doesn't have clear() method - just create a new one if needed
        // The old one will be garbage collected when no longer referenced
    };
}

/**
 * Achievement Cache Watcher
 * Monitors URL changes and syncs achievements when user views "Your Stuff" tab
 */
const log$1 = (msg, data) => {
    const logMsg = `[DeckProgressTracker][achievementCacheWatcher] ${msg}`;
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
 * Deck Progress Tracker - Main Plugin Entry
 * Decky Loader plugin for automatic game tagging
 *
 * Uses safe route patching pattern based on ProtonDB Badges plugin
 */
// Debug logging helper
const log = (msg, data) => {
    const logMsg = `[DeckProgressTracker] ${msg}`;
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
    let libraryGridPatch = null;
    try {
        libraryPatch = patchLibraryApp();
        log('Library app patch registered successfully');
    }
    catch (error) {
        log('Failed to register library app patch:', error);
    }
    // Patch the library grid view to add tag icons
    log('Setting up library grid patch');
    try {
        libraryGridPatch = patchLibraryGrid();
        log('Library grid patch registered successfully');
    }
    catch (error) {
        log('Failed to register library grid patch:', error);
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
                    title: 'Deck Progress Tracker',
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
        name: 'Deck Progress Tracker',
        titleView: SP_REACT.createElement("div", { className: DFL.staticClasses.Title }, "Deck Progress Tracker"),
        content: SP_REACT.createElement(Settings, null),
        icon: SP_REACT.createElement(FaTrophy, null),
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
            // Clean up library grid patch
            if (libraryGridPatch) {
                try {
                    libraryGridPatch(); // This calls the cleanup function
                    log('Library grid patch removed successfully');
                }
                catch (error) {
                    log('Error removing library grid patch:', error);
                }
            }
        }
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
