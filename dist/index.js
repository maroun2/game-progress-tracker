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
/**
 * Get all owned game appids from Steam's frontend API
 * This includes both installed and uninstalled games
 * Uses SteamClient.Apps.GetAllApps() which has access to the full library
 */
const getAllOwnedGameIds = async () => {
    // Primary method: SteamClient.Apps.GetAllApps()
    const steamClient = window.SteamClient;
    if (steamClient?.Apps?.GetAllApps) {
        try {
            const apps = await steamClient.Apps.GetAllApps();
            if (apps && apps.length > 0) {
                return apps.map((a) => String(a.appid || a)).filter((id) => parseInt(id) > 0);
            }
        }
        catch (e) {
            // GetAllApps failed, fall through to appStore method
        }
    }
    // Fallback: Try appStore if available
    const appStore = window.appStore;
    if (!appStore) {
        return [];
    }
    // Try m_mapApps (Map of all apps)
    if (appStore.m_mapApps instanceof Map) {
        const appids = Array.from(appStore.m_mapApps.keys()).map((id) => String(id));
        return appids.filter((id) => parseInt(id) > 0);
    }
    return [];
};
/**
 * Get achievement data for a list of appids from Steam's frontend API
 * Uses window.appAchievementProgressCache.m_achievementProgress.mapCache for full data
 */
const getAchievementData = async (appids) => {
    const achievementMap = {};
    const achievementCache = window.appAchievementProgressCache;
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
        }
        catch (e) {
        }
    }
    return achievementMap;
};
/**
 * Get playtime and last played data for a list of appids from Steam's frontend API
 * Uses window.appStore which is Steam's internal game data cache
 */
const getPlaytimeData = async (appids) => {
    const gameDataMap = {};
    const appStore = window.appStore;
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
        }
        catch (e) {
        }
    }
    return gameDataMap;
};
/**
 * Get game names for a list of appids from Steam's frontend API
 * Uses window.appStore.GetAppOverviewByAppID which has the display_name property
 * This works for ALL owned games, even uninstalled ones
 */
const getGameNames = async (appids) => {
    const nameMap = {};
    const appStore = window.appStore;
    if (!appStore) {
        return nameMap;
    }
    for (const appid of appids) {
        try {
            const overview = appStore.GetAppOverviewByAppID(parseInt(appid));
            if (overview && overview.display_name) {
                nameMap[appid] = overview.display_name;
            }
        }
        catch (e) {
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
const getAchievementDataWithFallback = async (appids) => {
    const cacheData = await getAchievementData(appids);
    const achievementMap = { ...cacheData };
    const missingAppids = appids.filter(appid => !achievementMap[appid]);
    if (missingAppids.length === 0) {
        return achievementMap;
    }
    const steamClient = window.SteamClient;
    if (!steamClient?.Apps?.GetMyAchievementsForApp) {
        return achievementMap;
    }
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
                }
            }
        }
        catch (e) {
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
const fetchAchievementsOnDemand = async (appid) => {
    const achievementCache = window.appAchievementProgressCache;
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
    const steamClient = window.SteamClient;
    if (steamClient?.Apps?.GetMyAchievementsForApp) {
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
                    return {
                        total,
                        unlocked,
                        percentage,
                        all_unlocked: total > 0 && unlocked === total
                    };
                }
            }
        }
        catch (e) {
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
const syncGames = async (appids) => {
    try {
        const gameData = await getPlaytimeData(appids);
        const achievementData = await getAchievementDataWithFallback(appids);
        const gameNames = await getGameNames(appids);
        try {
            const result = await call('sync_library_with_playtime', { game_data: gameData, achievement_data: achievementData, game_names: gameNames });
            if (result && result.success) {
                return result;
            }
            else {
                return result || { success: false, error: 'Backend returned null or undefined' };
            }
        }
        catch (backendError) {
            throw backendError;
        }
    }
    catch (e) {
        return { success: false, error: e?.message || 'Unknown error' };
    }
};
/**
 * Sync a single game with frontend data (playtime + achievements)
 * Called when viewing a game's detail page to get latest data
 * Uses cache + API fallback for achievements
 */
const syncSingleGameWithFrontendData = async (appid) => {
    const result = await syncGames([appid]);
    return { success: result.success, error: result.error };
};
/**
 * Progressive sync - process one game at a time completely before moving to next
 * This provides immediate feedback and avoids long waits for achievement fetching
 */
const syncLibraryProgressive = async (onProgress) => {
    try {
        const settingsResult = await call('get_settings');
        const useAllOwned = settingsResult?.settings?.source_all_owned ?? true;
        let appids;
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
                const gamesResult = await call('get_all_games');
                if (gamesResult.success && gamesResult.games) {
                    appids = gamesResult.games.map(g => g.appid);
                }
            }
        }
        else {
            const gamesResult = await call('get_all_games');
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
                const result = await call('sync_single_game_with_data', {
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
                }
                else {
                    errors++;
                }
            }
            catch (e) {
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
    }
    catch (e) {
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
    // Track if we're waiting for backend to start (during data collection phase)
    const [waitingForBackend, setWaitingForBackend] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        const pollSync = async () => {
            try {
                const res = await call('get_sync_progress');
                if (res.success && res.syncing) {
                    // Backend is syncing - always show progress regardless of frontend state
                    // This handles sync from any source (manual, auto, initial load)
                    setMessage(`Syncing: ${res.current}/${res.total} games`);
                    setSyncing(true);
                    setWaitingForBackend(false);
                }
                else if (res.success && !res.syncing && syncing) {
                    // Backend finished but frontend still thinks it's syncing
                    // If we were waiting for backend to start, keep waiting
                    if (waitingForBackend) {
                        // Still preparing data, don't change state
                        return;
                    }
                    // Backend actually finished - clear syncing state and show completion
                    setSyncing(false);
                    smartUpdateUI();
                    // If the sync wasn't initiated by the button (no finally block to handle it),
                    // we should still show completion
                    if (res.total && res.total > 0) {
                        setMessage(`Sync complete! Library updated.`);
                        setTimeout(() => setMessage(null), 5000);
                    }
                }
            }
            catch (err) { }
        };
        const interval = setInterval(pollSync, syncing ? 500 : 2000);
        return () => clearInterval(interval);
    }, [syncing, waitingForBackend]);
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
            setWaitingForBackend(false); // No longer waiting since we process immediately
            setMessage('Starting sync...');
            // Use progressive sync with progress callback
            const result = await syncLibraryProgressive((current, total, gameName) => {
                // Only show consistent progress numbers, no game names to avoid flickering
                setMessage(`Syncing: ${current}/${total} games`);
                // Periodically update UI to show new tags
                if (current % 10 === 0 || current === total) {
                    smartUpdateUI();
                }
            });
            // Sync completed
            smartUpdateUI();
            const msg = `Sync complete! ${result.synced} games updated${result.new_tags ? `, ${result.new_tags} new tags` : ''}.`;
            setMessage(msg);
            toaster.toast({ title: 'Deck Progress Tracker', body: msg, duration: 5000 });
            // Clear message after a delay
            setTimeout(() => setMessage(null), 10000);
        }
        catch (err) {
            setMessage(`Sync error: ${err?.message || 'Unknown'}`);
        }
        finally {
            setSyncing(false);
            setWaitingForBackend(false);
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
    if (!tag || !tag.tag) {
        return null;
    }
    const style = TAG_STYLES[tag.tag];
    if (!style) {
        return null;
    }
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
const TagManager = ({ appid, onClose }) => {
    const [details, setDetails] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    SP_REACT.useEffect(() => {
        fetchDetails();
    }, [appid]);
    const fetchDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await call('get_game_details', { appid });
            setDetails(result);
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to load game details';
            setError(errorMsg);
            // Error occurred
        }
        finally {
            setLoading(false);
        }
    };
    const setTag = async (tag) => {
        try {
            await call('set_manual_tag', { appid, tag });
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to set tag';
            setError(errorMsg);
            // Error occurred
        }
    };
    const resetToAuto = async () => {
        try {
            await call('reset_to_auto_tag', { appid });
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to reset tag';
            setError(errorMsg);
            // Error occurred
        }
    };
    const removeTag = async () => {
        try {
            await call('remove_tag', { appid });
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to remove tag';
            setError(errorMsg);
            // Error occurred
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
function useGameTag(appid) {
    const [tag, setTag] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(true);
    const [error, setError] = SP_REACT.useState(null);
    SP_REACT.useEffect(() => {
        fetchTag();
    }, [appid]);
    const fetchTag = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await call('get_game_tag', { appid });
            setTag(result.tag);
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to fetch tag';
            setError(errorMsg);
            // Error occurred
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
            // Error occurred
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
            // Error occurred
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
            // Error occurred
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
        // Sync this game's data when detail page is viewed
        // This ensures we have the latest playtime and achievement data
        (async () => {
            try {
                const result = await syncSingleGameWithFrontendData(appid);
                if (result.success) {
                    refetch();
                }
            }
            catch (e) {
                // Error syncing game
            }
        })();
    }, [appid]);
    // Watch for fullscreen mode changes (same pattern as ProtonDB)
    SP_REACT.useEffect(() => {
        const topCapsule = findTopCapsuleParent(ref?.current);
        if (!topCapsule) {
            return;
        }
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
    if (loading) {
        return SP_REACT.createElement("div", { ref: ref, style: { display: 'none' } });
    }
    const handleClick = () => {
        setShowManager(true);
    };
    const handleClose = () => {
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
        // Error occurred
        return null;
    }
}
/**
 * Patch the library app page to inject our tag badge
 * Following the ProtonDB Badges pattern for safety
 */
function patchLibraryApp() {
    return routerHook.addPatch('/library/app/:appid', (tree) => {
        try {
            // Find the route props with renderFunc (same pattern as ProtonDB)
            const routeProps = DFL.findInReactTree(tree, (x) => x?.renderFunc);
            if (routeProps) {
                const patchHandler = DFL.createReactTreePatcher([
                    (tree) => DFL.findInReactTree(tree, (x) => x?.props?.children?.props?.overview)?.props?.children
                ], (_, ret) => {
                    // Find the inner container where we'll inject our badge
                    const container = DFL.findInReactTree(ret, (x) => Array.isArray(x?.props?.children) &&
                        x?.props?.className?.includes(DFL.appDetailsClasses.InnerContainer));
                    if (typeof container !== 'object') {
                        return ret;
                    }
                    // Get appid from URL since we're inside the render
                    const appid = getAppIdFromUrl();
                    if (appid) {
                        // Inject our badge component at position 0 (first child, will use absolute positioning)
                        container.props.children.splice(0, 0, SP_REACT.createElement(GameTagBadge, { key: "game-progress-tag", appid: appid }));
                    }
                    return ret;
                });
                DFL.afterPatch(routeProps, "renderFunc", patchHandler);
            }
        }
        catch (error) {
            // Error occurred
        }
        return tree;
    });
}

/**
 * Achievement Cache Watcher
 * Monitors URL changes and syncs achievements when user views "Your Stuff" tab
 */
let lastUrl = '';
let syncTimeout = null;
/**
 * Start watching for URL changes to detect when user views achievements
 */
function startAchievementCacheWatcher() {
    // Poll for URL changes every 500ms
    setInterval(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            // Check if user opened "Your Stuff" tab (where achievements are shown)
            const yourStuffMatch = currentUrl.match(/\/library\/app\/(\d+)\/tab\/YourStuff/);
            if (yourStuffMatch) {
                const appid = yourStuffMatch[1];
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
                        return;
                    }
                    // Poll with exponential backoff: 500ms, 1s, 2s, 3s, 3s (total ~10s max)
                    const delays = [500, 1000, 2000, 3000, 3000];
                    let foundData = false;
                    for (let i = 0; i < delays.length; i++) {
                        await new Promise(resolve => setTimeout(resolve, delays[i]));
                        const entry = mapCache.get(parseInt(appid));
                        if (entry && entry.total > 0) {
                            foundData = true;
                            break;
                        }
                    }
                    if (foundData) {
                        try {
                            await syncSingleGameWithFrontendData(appid);
                        }
                        catch (e) {
                            // Error occurred
                        }
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
/**
 * Main Plugin Definition
 */
var index = definePlugin(() => {
    // Patch the game library page using the safe ProtonDB-style approach
    let libraryPatch = null;
    try {
        libraryPatch = patchLibraryApp();
    }
    catch (error) {
        // Failed to register library app patch
    }
    // Start achievement cache watcher (monitors when user views "Your Stuff" tab)
    startAchievementCacheWatcher();
    // Trigger sync with frontend data (replaces backend auto-sync)
    // This uses Steam's frontend API for real-time playtime and achievement data
    // Add a delay before attempting sync to let Steam frontend initialize
    const syncDelay = 5000; // Start with 5 seconds delay
    setTimeout(async () => {
        try {
            // Use progressive sync with progress logging
            const result = await syncLibraryProgressive((current, total, gameName) => {
                // Progress callback - could be used for UI updates in future
            });
            // Show toast notification when initial sync completes
            // Use new_tags count from backend for accurate notification
            if (result && result.success && result.synced && result.synced > 0) {
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
            else if (!result || !result.success) {
                // Show error toast
                toaster.toast({
                    title: 'Deck Progress Tracker',
                    body: `Initial sync failed: ${result?.error || 'Unknown error'}. Will retry...`,
                    duration: 5000,
                });
                // Retry once more after additional delay
                setTimeout(async () => {
                    try {
                        const retryResult = await syncLibraryProgressive((current, total, gameName) => {
                            // Progress callback for retry
                        });
                        if (retryResult && retryResult.success && retryResult.synced) {
                            toaster.toast({
                                title: 'Deck Progress Tracker',
                                body: `Library synced: ${retryResult.synced} games processed`,
                                duration: 5000,
                            });
                        }
                        else {
                            toaster.toast({
                                title: 'Deck Progress Tracker',
                                body: 'Auto-sync failed. Please sync manually from settings.',
                                duration: 8000,
                            });
                        }
                    }
                    catch (retryErr) {
                        // Retry sync failed
                    }
                }, 10000);
            }
        }
        catch (err) {
            // Show error toast
            toaster.toast({
                title: 'Deck Progress Tracker',
                body: `Sync error: ${err?.message || 'Unknown error'}`,
                duration: 5000,
            });
        }
    }, syncDelay);
    return {
        name: 'Deck Progress Tracker',
        titleView: SP_REACT.createElement("div", { className: DFL.staticClasses.Title }, "Deck Progress Tracker"),
        content: SP_REACT.createElement(Settings, null),
        icon: SP_REACT.createElement(FaTrophy, null),
        onDismount() {
            // Stop achievement cache watcher
            stopAchievementCacheWatcher();
            // Clean up patches when plugin is unloaded
            if (libraryPatch) {
                try {
                    routerHook.removePatch('/library/app/:appid', libraryPatch);
                }
                catch (error) {
                    // Error removing library app patch
                }
            }
        }
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
