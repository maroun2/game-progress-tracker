const manifest = {"name":"Game Progress Tracker","author":"Maron","version":"1.1.13","api_version":1,"flags":["_root"],"publish":{"tags":["library","achievements","statistics","enhancement"],"description":"Automatic game tagging based on achievements, playtime, and completion time. Track your progress with visual badges in the Steam library.","image":"https://opengraph.githubassets.com/1/SteamDeckHomebrew/decky-loader"}};
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
        type === 'backlog' && SP_REACT.createElement(EmptyCircleIcon, { size: size, color: color })));
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
/**
 * Get playtime data for a list of appids from Steam's frontend API
 * Uses window.appStore which is Steam's internal game data cache
 */
const getPlaytimeData = async (appids) => {
    await logToBackend('info', `getPlaytimeData called with ${appids.length} appids`);
    const playtimeMap = {};
    // Access Steam's global appStore (typed by @decky/ui)
    const appStore = window.appStore;
    await logToBackend('info', `appStore available: ${!!appStore}, type: ${typeof appStore}`);
    if (!appStore) {
        await logToBackend('error', 'appStore not available - cannot get playtime!');
        return playtimeMap;
    }
    // Check if GetAppOverviewByAppID method exists
    await logToBackend('info', `GetAppOverviewByAppID exists: ${typeof appStore.GetAppOverviewByAppID}`);
    let successCount = 0;
    let failCount = 0;
    let withPlaytime = 0;
    const failedAppids = [];
    const sampleLogs = [];
    // Synchronous loop - no awaits inside to avoid issues
    for (const appid of appids) {
        try {
            const overview = appStore.GetAppOverviewByAppID(parseInt(appid));
            if (overview) {
                const playtime = overview.minutes_playtime_forever || 0;
                playtimeMap[appid] = playtime;
                successCount++;
                if (playtime > 0)
                    withPlaytime++;
                // Collect first few for logging later
                if (sampleLogs.length < 3) {
                    sampleLogs.push(`appid ${appid}: playtime=${playtime}min, name=${overview.display_name || 'unknown'}`);
                }
            }
            else {
                failCount++;
                if (failedAppids.length < 5) {
                    failedAppids.push(appid);
                }
            }
        }
        catch (e) {
            failCount++;
            if (failedAppids.length < 5) {
                failedAppids.push(appid);
            }
        }
    }
    // Log results after the loop
    for (const log of sampleLogs) {
        await logToBackend('info', `Sample - ${log}`);
    }
    if (failedAppids.length > 0) {
        await logToBackend('info', `Failed appids (first 5): ${failedAppids.join(', ')}`);
    }
    await logToBackend('info', `getPlaytimeData results: success=${successCount}, failed=${failCount}, withPlaytime=${withPlaytime}`);
    await logToBackend('info', `playtimeMap size: ${Object.keys(playtimeMap).length}`);
    await logToBackend('info', `playtimeMap keys sample: ${Object.keys(playtimeMap).slice(0, 10).join(', ')}`);
    return playtimeMap;
};
// Tag color mapping
const TAG_COLORS = {
    completed: '#38ef7d',
    in_progress: '#764ba2',
    mastered: '#f5576c',
    backlog: '#888',
};
const Settings = () => {
    const [settings, setSettings] = SP_REACT.useState({
        auto_tag_enabled: true,
        mastered_multiplier: 1.5, // Deprecated, kept for compatibility
        in_progress_threshold: 30,
        cache_ttl: 7200,
        source_installed: true,
        source_non_steam: true,
    });
    const [stats, setStats] = SP_REACT.useState(null);
    const [loading, setLoading] = SP_REACT.useState(false);
    const [syncing, setSyncing] = SP_REACT.useState(false);
    const [message, setMessage] = SP_REACT.useState(null);
    // Tagged games list state
    const [taggedGames, setTaggedGames] = SP_REACT.useState([]);
    const [expandedSections, setExpandedSections] = SP_REACT.useState({
        completed: true,
        in_progress: true,
        backlog: false,
        mastered: true,
    });
    const [loadingGames, setLoadingGames] = SP_REACT.useState(false);
    // Settings section state
    const [showSettings, setShowSettings] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        loadSettings();
        loadStats();
        loadTaggedGames(); // Always load on mount
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
    const toggleSection = (tagType) => {
        setExpandedSections(prev => ({
            ...prev,
            [tagType]: !prev[tagType],
        }));
    };
    const navigateToGame = (appid) => {
        DFL.Navigation.Navigate(`/library/app/${appid}`);
        DFL.Navigation.CloseSideMenus();
    };
    const updateSetting = async (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        try {
            await call('update_settings', { settings: newSettings });
            showMessage('Settings saved');
        }
        catch (err) {
            console.error('Error updating settings:', err);
            showMessage('Failed to save settings');
        }
    };
    const syncLibrary = async () => {
        await logToBackend('info', '========================================');
        await logToBackend('info', `syncLibrary button clicked - v${"1.1.13"}`);
        await logToBackend('info', '========================================');
        try {
            setSyncing(true);
            setMessage('Fetching game list...');
            // Step 1: Get all game appids from backend
            await logToBackend('info', 'Step 1: Calling backend get_all_games...');
            const gamesResult = await call('get_all_games');
            await logToBackend('info', `get_all_games response: ${JSON.stringify(gamesResult).slice(0, 500)}`);
            if (!gamesResult.success || !gamesResult.games) {
                await logToBackend('error', `get_all_games failed: ${gamesResult.error}`);
                showMessage(`Failed to get game list: ${gamesResult.error || 'Unknown error'}`);
                return;
            }
            const appids = gamesResult.games.map(g => g.appid);
            await logToBackend('info', `Step 1 complete: Got ${appids.length} games from backend`);
            await logToBackend('info', `First 5 appids: ${appids.slice(0, 5).join(', ')}`);
            await logToBackend('info', `Appid types: ${appids.slice(0, 5).map(a => typeof a).join(', ')}`);
            // Step 2: Get playtime from Steam frontend API
            await logToBackend('info', 'Step 2: Getting playtime from Steam frontend API...');
            setMessage(`Getting playtime data for ${appids.length} games...`);
            const playtimeData = await getPlaytimeData(appids);
            const gamesWithPlaytime = Object.values(playtimeData).filter(v => v > 0).length;
            await logToBackend('info', `Step 2 complete: Got playtime for ${gamesWithPlaytime}/${appids.length} games`);
            // Log sample of playtime data
            const sampleEntries = Object.entries(playtimeData).slice(0, 5);
            await logToBackend('info', `Sample playtime data: ${JSON.stringify(sampleEntries)}`);
            // Step 3: Sync with playtime data
            await logToBackend('info', 'Step 3: Calling backend sync_library_with_playtime...');
            await logToBackend('info', `Sending ${Object.keys(playtimeData).length} playtime entries to backend`);
            setMessage('Syncing library... This may take several minutes.');
            const result = await call('sync_library_with_playtime', { playtime_data: playtimeData });
            await logToBackend('info', `Step 3 complete - sync result: ${JSON.stringify(result)}`);
            if (result.success) {
                showMessage(`Sync complete! ${result.synced}/${result.total} games synced. ` +
                    (result.errors ? `${result.errors} errors.` : ''));
                await loadStats();
                await loadTaggedGames();
            }
            else {
                showMessage(`Sync failed: ${result.error}`);
            }
        }
        catch (err) {
            console.error('[GameProgressTracker] Error syncing library:', err);
            showMessage(`Sync error: ${err?.message || 'Unknown error'}`);
        }
        finally {
            setSyncing(false);
        }
    };
    const refreshCache = async () => {
        try {
            setLoading(true);
            await call('refresh_hltb_cache');
            showMessage('Cache will be refreshed on next sync');
        }
        catch (err) {
            console.error('Error refreshing cache:', err);
            showMessage('Failed to refresh cache');
        }
        finally {
            setLoading(false);
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
        completed: 'Completed (Beat Main Story)',
        in_progress: 'In Progress',
        backlog: 'Backlog (Not Started)',
        mastered: 'Mastered (100% Achievements)',
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
        SP_REACT.createElement("h2", { style: styles$1.title }, "Game Progress Tracker"),
        message && (SP_REACT.createElement("div", { style: styles$1.message }, message)),
        SP_REACT.createElement("div", { style: styles$1.section },
            SP_REACT.createElement("h3", { style: styles$1.sectionTitle },
                "Library (",
                totalGames,
                " games)"),
            loadingGames ? (SP_REACT.createElement("div", { style: styles$1.loadingText }, "Loading games...")) : totalGames === 0 ? (SP_REACT.createElement("div", { style: styles$1.loadingText }, "No games synced yet. Click \"Sync Entire Library\" to tag your games based on playtime and achievements.")) : (SP_REACT.createElement("div", { style: styles$1.taggedListContainer }, ['completed', 'in_progress', 'backlog', 'mastered'].map((tagType) => {
                if (!tagType)
                    return null;
                const games = groupedGames[tagType] || [];
                const count = getCategoryCount(tagType);
                const isExpanded = expandedSections[tagType];
                const isBacklog = tagType === 'backlog';
                return (SP_REACT.createElement("div", { key: tagType, style: styles$1.tagSection },
                    SP_REACT.createElement("button", { onClick: () => !isBacklog && toggleSection(tagType), style: {
                            ...styles$1.tagSectionHeader,
                            cursor: isBacklog ? 'default' : 'pointer',
                        } },
                        SP_REACT.createElement("div", { style: styles$1.tagSectionLeft },
                            SP_REACT.createElement(TagIcon, { type: tagType, size: 18 }),
                            SP_REACT.createElement("span", { style: styles$1.tagSectionTitle }, tagLabels[tagType])),
                        SP_REACT.createElement("div", { style: styles$1.tagSectionRight },
                            SP_REACT.createElement("span", { style: { ...styles$1.tagCount, color: TAG_COLORS[tagType] } }, count),
                            !isBacklog && (SP_REACT.createElement("span", { style: styles$1.expandIcon }, isExpanded ? '−' : '+')))),
                    !isBacklog && isExpanded && games.length > 0 && (SP_REACT.createElement("div", { style: styles$1.gameList }, games.map((game) => (SP_REACT.createElement("div", { key: game.appid, style: styles$1.gameItem, onClick: () => navigateToGame(game.appid) },
                        SP_REACT.createElement("span", { style: {
                                ...styles$1.smallDot,
                                backgroundColor: TAG_COLORS[game.tag],
                            } }),
                        SP_REACT.createElement("span", { style: styles$1.gameName }, game.game_name),
                        game.is_manual && (SP_REACT.createElement("span", { style: styles$1.manualBadge }, "manual"))))))),
                    !isBacklog && isExpanded && games.length === 0 && (SP_REACT.createElement("div", { style: styles$1.emptySection }, "No games with this tag"))));
            })))),
        SP_REACT.createElement("div", { style: styles$1.section },
            SP_REACT.createElement("button", { onClick: syncLibrary, disabled: syncing || loading, style: syncing ? styles$1.buttonDisabled : styles$1.button }, syncing ? 'Syncing...' : 'Sync Entire Library'),
            SP_REACT.createElement("div", { style: styles$1.hint }, "Sync may take several minutes for large libraries")),
        SP_REACT.createElement("div", { style: styles$1.section },
            SP_REACT.createElement("button", { onClick: () => setShowSettings(!showSettings), style: styles$1.expandButton },
                showSettings ? '- Hide' : '+ Show',
                " Settings"),
            showSettings && (SP_REACT.createElement("div", { style: styles$1.settingsContainer },
                SP_REACT.createElement("div", { style: styles$1.settingGroup },
                    SP_REACT.createElement("h4", { style: styles$1.settingGroupTitle }, "Automatic Tagging"),
                    SP_REACT.createElement("div", { style: styles$1.settingRow },
                        SP_REACT.createElement("label", { style: styles$1.label },
                            SP_REACT.createElement("input", { type: "checkbox", checked: settings.auto_tag_enabled, onChange: (e) => updateSetting('auto_tag_enabled', e.target.checked), style: styles$1.checkbox }),
                            "Enable Auto-Tagging"))),
                SP_REACT.createElement("div", { style: styles$1.settingGroup },
                    SP_REACT.createElement("h4", { style: styles$1.settingGroupTitle }, "Tag Rules"),
                    SP_REACT.createElement("div", { style: styles$1.tagRulesInfo },
                        SP_REACT.createElement("div", { style: styles$1.tagRule },
                            SP_REACT.createElement(TagIcon, { type: "mastered", size: 16 }),
                            SP_REACT.createElement("strong", null, "Mastered:"),
                            " 100% achievements unlocked"),
                        SP_REACT.createElement("div", { style: styles$1.tagRule },
                            SP_REACT.createElement(TagIcon, { type: "completed", size: 16 }),
                            SP_REACT.createElement("strong", null, "Completed:"),
                            " Playtime \u2265 main story time (from HLTB)"),
                        SP_REACT.createElement("div", { style: styles$1.tagRule },
                            SP_REACT.createElement(TagIcon, { type: "in_progress", size: 16 }),
                            SP_REACT.createElement("strong", null, "In Progress:"),
                            " Playtime \u2265 ",
                            settings.in_progress_threshold,
                            " minutes")),
                    SP_REACT.createElement("div", { style: styles$1.settingRow },
                        SP_REACT.createElement("label", { style: styles$1.label },
                            "In Progress Threshold: ",
                            settings.in_progress_threshold,
                            " minutes"),
                        SP_REACT.createElement("input", { type: "range", min: "15", max: "120", step: "15", value: settings.in_progress_threshold, onChange: (e) => updateSetting('in_progress_threshold', parseInt(e.target.value)), style: styles$1.slider }),
                        SP_REACT.createElement("div", { style: styles$1.hint }, "Minimum playtime to mark as In Progress"))),
                SP_REACT.createElement("div", { style: styles$1.settingGroup },
                    SP_REACT.createElement("h4", { style: styles$1.settingGroupTitle }, "Game Sources"),
                    SP_REACT.createElement("div", { style: styles$1.hint }, "Select which games to include when syncing"),
                    SP_REACT.createElement("div", { style: styles$1.settingRow },
                        SP_REACT.createElement("label", { style: styles$1.label },
                            SP_REACT.createElement("input", { type: "checkbox", checked: settings.source_installed, onChange: (e) => updateSetting('source_installed', e.target.checked), style: styles$1.checkbox }),
                            "Installed Steam Games")),
                    SP_REACT.createElement("div", { style: styles$1.settingRow },
                        SP_REACT.createElement("label", { style: styles$1.label },
                            SP_REACT.createElement("input", { type: "checkbox", checked: settings.source_non_steam, onChange: (e) => updateSetting('source_non_steam', e.target.checked), style: styles$1.checkbox }),
                            "Non-Steam Games (Shortcuts)"))),
                SP_REACT.createElement("div", { style: styles$1.settingGroup },
                    SP_REACT.createElement("h4", { style: styles$1.settingGroupTitle }, "Cache"),
                    SP_REACT.createElement("button", { onClick: refreshCache, disabled: syncing || loading, style: styles$1.buttonSecondary }, "Refresh HLTB Cache"))))),
        SP_REACT.createElement("div", { style: styles$1.section },
            SP_REACT.createElement("h3", { style: styles$1.sectionTitle }, "About"),
            SP_REACT.createElement("div", { style: styles$1.about },
                SP_REACT.createElement("p", null,
                    "Game Progress Tracker v",
                    "1.1.13"),
                SP_REACT.createElement("p", null, "Automatic game tagging based on achievements, playtime, and completion time."),
                SP_REACT.createElement("p", { style: styles$1.smallText }, "Data from HowLongToBeat \u2022 Steam achievement system")))));
};
const styles$1 = {
    container: {
        padding: '16px',
        color: 'white',
    },
    title: {
        margin: '0 0 20px 0',
        fontSize: '24px',
        fontWeight: 'bold',
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
        cursor: 'pointer',
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
        cursor: 'pointer',
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
};

/**
 * GameTag Component
 * Displays a colored badge with icon for game tags
 */
// Debug logging helper
const log$5 = (msg, data) => {
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
    }
};
const GameTag = ({ tag, onClick, compact = false }) => {
    log$5(`GameTag render: tag=${tag?.tag || 'null'}, compact=${compact}, hasOnClick=${!!onClick}`);
    if (!tag || !tag.tag) {
        log$5('GameTag: no tag, returning null');
        return null;
    }
    const style = TAG_STYLES[tag.tag];
    if (!style) {
        log$5(`GameTag: no style for tag=${tag.tag}, returning null`);
        return null;
    }
    log$5(`GameTag: rendering badge for tag=${tag.tag}`);
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
const log$4 = (msg, data) => {
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
    log$4(`TagManager mounted for appid=${appid}`);
    SP_REACT.useEffect(() => {
        log$4(`TagManager useEffect: fetching details for appid=${appid}`);
        fetchDetails();
    }, [appid]);
    const fetchDetails = async () => {
        try {
            log$4(`fetchDetails: calling get_game_details for appid=${appid}`);
            setLoading(true);
            setError(null);
            const result = await call('get_game_details', { appid });
            log$4(`fetchDetails: result for appid=${appid}:`, result);
            setDetails(result);
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to load game details';
            setError(errorMsg);
            log$4(`fetchDetails: error for appid=${appid}: ${errorMsg}`, err);
        }
        finally {
            setLoading(false);
        }
    };
    const setTag = async (tag) => {
        try {
            log$4(`setTag: calling set_manual_tag for appid=${appid}, tag=${tag}`);
            const result = await call('set_manual_tag', { appid, tag });
            log$4(`setTag: result for appid=${appid}:`, result);
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to set tag';
            setError(errorMsg);
            log$4(`setTag: error for appid=${appid}: ${errorMsg}`, err);
        }
    };
    const resetToAuto = async () => {
        try {
            log$4(`resetToAuto: calling reset_to_auto_tag for appid=${appid}`);
            const result = await call('reset_to_auto_tag', { appid });
            log$4(`resetToAuto: result for appid=${appid}:`, result);
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to reset tag';
            setError(errorMsg);
            log$4(`resetToAuto: error for appid=${appid}: ${errorMsg}`, err);
        }
    };
    const removeTag = async () => {
        try {
            log$4(`removeTag: calling remove_tag for appid=${appid}`);
            const result = await call('remove_tag', { appid });
            log$4(`removeTag: result for appid=${appid}:`, result);
            await fetchDetails();
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to remove tag';
            setError(errorMsg);
            log$4(`removeTag: error for appid=${appid}: ${errorMsg}`, err);
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
                SP_REACT.createElement("button", { onClick: onClose, style: styles.button }, "Close"))));
    }
    const stats = details.stats;
    const tag = details.tag;
    const hltb = details.hltb_data;
    return (SP_REACT.createElement("div", { style: styles.modal, onClick: onClose },
        SP_REACT.createElement("div", { style: styles.content, onClick: (e) => e.stopPropagation() },
            SP_REACT.createElement("h2", { style: styles.title },
                "Manage Tags: ",
                stats?.game_name || `Game ${appid}`),
            SP_REACT.createElement("div", { style: styles.section },
                SP_REACT.createElement("h3", { style: styles.sectionTitle }, "Game Statistics"),
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
                        SP_REACT.createElement("span", null,
                            hltb.matched_name,
                            " (",
                            (hltb.similarity * 100).toFixed(0),
                            "%)")),
                    hltb.main_extra && (SP_REACT.createElement("div", { style: styles.statRow },
                        SP_REACT.createElement("span", null, "Main+Extra:"),
                        SP_REACT.createElement("span", null,
                            hltb.main_extra,
                            "h")))))),
            SP_REACT.createElement("div", { style: styles.section },
                SP_REACT.createElement("h3", { style: styles.sectionTitle }, "Current Tag"),
                SP_REACT.createElement("div", { style: styles.currentTag }, tag?.tag ? (SP_REACT.createElement(SP_REACT.Fragment, null,
                    SP_REACT.createElement(TagIcon, { type: tag.tag, size: 24 }),
                    SP_REACT.createElement("span", { style: { color: TAG_ICON_COLORS[tag.tag] } }, tag.tag.replace('_', ' ').toUpperCase()),
                    SP_REACT.createElement("span", { style: styles.tagType }, tag.is_manual ? '(Manual)' : '(Automatic)'))) : (SP_REACT.createElement("span", { style: styles.noTag }, "No tag assigned")))),
            SP_REACT.createElement("div", { style: styles.section },
                SP_REACT.createElement("h3", { style: styles.sectionTitle }, "Set Tag"),
                SP_REACT.createElement("div", { style: styles.tagButtonGroup },
                    SP_REACT.createElement("button", { onClick: () => setTag('mastered'), style: { ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.mastered } },
                        SP_REACT.createElement(TagIcon, { type: "mastered", size: 20 }),
                        SP_REACT.createElement("span", null, "Mastered")),
                    SP_REACT.createElement("button", { onClick: () => setTag('completed'), style: { ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.completed } },
                        SP_REACT.createElement(TagIcon, { type: "completed", size: 20 }),
                        SP_REACT.createElement("span", null, "Completed")),
                    SP_REACT.createElement("button", { onClick: () => setTag('in_progress'), style: { ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.in_progress } },
                        SP_REACT.createElement(TagIcon, { type: "in_progress", size: 20 }),
                        SP_REACT.createElement("span", null, "In Progress"))),
                SP_REACT.createElement("div", { style: styles.buttonGroup },
                    SP_REACT.createElement("button", { onClick: resetToAuto, style: styles.secondaryButton }, "Reset to Automatic"),
                    SP_REACT.createElement("button", { onClick: removeTag, style: styles.secondaryButton }, "Remove Tag"))),
            SP_REACT.createElement("button", { onClick: onClose, style: styles.closeButton }, "Close"))));
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
    },
    content: {
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        color: 'white',
    },
    title: {
        margin: '0 0 20px 0',
        fontSize: '20px',
        fontWeight: 'bold',
    },
    section: {
        marginBottom: '20px',
        paddingBottom: '20px',
        borderBottom: '1px solid #333',
    },
    sectionTitle: {
        margin: '0 0 12px 0',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#aaa',
    },
    statRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        fontSize: '14px',
    },
    currentTag: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#252525',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    tagType: {
        fontSize: '12px',
        color: '#888',
        fontWeight: 'normal',
    },
    noTag: {
        color: '#888',
        fontStyle: 'italic',
    },
    buttonGroup: {
        display: 'flex',
        gap: '8px',
        marginBottom: '8px',
        flexWrap: 'wrap',
    },
    tagButtonGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '12px',
    },
    tagButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '14px',
        border: 'none',
        borderRadius: '6px',
        color: 'white',
        fontSize: '15px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'opacity 0.2s',
    },
    secondaryButton: {
        flex: 1,
        padding: '10px',
        backgroundColor: '#444',
        border: 'none',
        borderRadius: '4px',
        color: 'white',
        fontSize: '13px',
        cursor: 'pointer',
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
        cursor: 'pointer',
        marginTop: '8px',
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
        cursor: 'pointer',
        marginTop: '12px',
    },
};

/**
 * React hook for managing game tags
 */
// Debug logging helper
const log$3 = (msg, data) => {
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
        log$3(`useEffect triggered for appid=${appid}`);
        fetchTag();
    }, [appid]);
    const fetchTag = async () => {
        try {
            log$3(`fetchTag: calling get_game_tag for appid=${appid}`);
            setLoading(true);
            setError(null);
            const result = await call('get_game_tag', { appid });
            log$3(`fetchTag: result for appid=${appid}:`, result);
            setTag(result.tag);
        }
        catch (err) {
            const errorMsg = err?.message || 'Failed to fetch tag';
            setError(errorMsg);
            log$3(`fetchTag: error for appid=${appid}: ${errorMsg}`, err);
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
 */
// Debug logging helper
const log$2 = (msg, data) => {
    const logMsg = `[GameProgressTracker][GameTagBadge] ${msg}`;
    if (data !== undefined) {
        console.log(logMsg, data);
    }
    else {
        console.log(logMsg);
    }
};
/**
 * Placeholder button when no tag exists
 */
const AddTagButton = ({ onClick }) => {
    const buttonStyle = {
        position: 'relative',
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
        marginTop: '10px',
    };
    return (SP_REACT.createElement("div", { onClick: onClick, style: buttonStyle, title: "Click to add tag" },
        SP_REACT.createElement("span", { style: { fontSize: '16px' } }, "+"),
        SP_REACT.createElement("span", null, "Add Tag")));
};
/**
 * GameTagBadge - Main component injected into library app page
 * Shows tag badge or "Add Tag" button, with TagManager modal
 */
const GameTagBadge = ({ appid }) => {
    const { tag, loading, error, refetch } = useGameTag(appid);
    const [showManager, setShowManager] = SP_REACT.useState(false);
    SP_REACT.useEffect(() => {
        log$2(`Mounted: appid=${appid}`);
        return () => {
            log$2(`Unmounted: appid=${appid}`);
        };
    }, [appid]);
    SP_REACT.useEffect(() => {
        log$2(`State update: appid=${appid}, loading=${loading}, tag=`, tag);
        if (error) {
            log$2(`Error: ${error}`);
        }
    }, [appid, tag, loading, error]);
    if (loading) {
        log$2(`Still loading for appid=${appid}`);
        return null;
    }
    log$2(`Rendering: appid=${appid}, hasTag=${!!tag}, tagValue=${tag?.tag || 'none'}`);
    const handleClick = () => {
        log$2(`Tag button clicked for appid=${appid}`);
        setShowManager(true);
    };
    const handleClose = () => {
        log$2(`TagManager closed for appid=${appid}`);
        setShowManager(false);
        refetch();
    };
    // Container style - positions the badge in the header area
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '0 16px',
    };
    return (SP_REACT.createElement("div", { style: containerStyle },
        tag && tag.tag ? (SP_REACT.createElement("div", { style: { position: 'relative', display: 'inline-flex', marginTop: '10px' } },
            SP_REACT.createElement(GameTag, { tag: tag, onClick: handleClick }))) : (SP_REACT.createElement(AddTagButton, { onClick: handleClick })),
        showManager && (SP_REACT.createElement(TagManager, { appid: appid, onClose: handleClose }))));
};

/**
 * Library App Route Patching
 * Based on ProtonDB Badges plugin implementation
 * Uses proper Decky UI patching utilities for safety
 */
// Debug logging helper
const log$1 = (msg, data) => {
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
        log$1('Error getting appid from URL:', e);
        return null;
    }
}
/**
 * Patch the library app page to inject our tag badge
 * Following the ProtonDB Badges pattern for safety
 */
function patchLibraryApp() {
    log$1('Setting up library app patch');
    return routerHook.addPatch('/library/app/:appid', (tree) => {
        log$1('Route patch callback triggered');
        try {
            // Find the route props with renderFunc (same pattern as ProtonDB)
            const routeProps = DFL.findInReactTree(tree, (x) => x?.renderFunc);
            if (routeProps) {
                log$1('Found routeProps with renderFunc');
                const patchHandler = DFL.createReactTreePatcher([
                    (tree) => DFL.findInReactTree(tree, (x) => x?.props?.children?.props?.overview)?.props?.children
                ], (_, ret) => {
                    // Find the inner container where we'll inject our badge
                    const container = DFL.findInReactTree(ret, (x) => Array.isArray(x?.props?.children) &&
                        x?.props?.className?.includes(DFL.appDetailsClasses.InnerContainer));
                    if (typeof container !== 'object') {
                        log$1('Container not found, returning original');
                        return ret;
                    }
                    // Get appid from URL since we're inside the render
                    const appid = getAppIdFromUrl();
                    if (appid) {
                        log$1(`Injecting GameTagBadge for appid=${appid}`);
                        // Inject our badge component at position 1 (after the first child)
                        container.props.children.splice(1, 0, SP_REACT.createElement(GameTagBadge, { key: "game-progress-tag", appid: appid }));
                    }
                    else {
                        log$1('Could not determine appid');
                    }
                    return ret;
                });
                DFL.afterPatch(routeProps, "renderFunc", patchHandler);
                log$1('Patch handler attached to renderFunc');
            }
            else {
                log$1('routeProps with renderFunc not found');
            }
        }
        catch (error) {
            log$1('Error in route patch:', error);
        }
        return tree;
    });
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
    return {
        name: 'Game Progress Tracker',
        titleView: SP_REACT.createElement("div", { className: DFL.staticClasses.Title }, "Game Progress Tracker"),
        content: SP_REACT.createElement(Settings, null),
        icon: (SP_REACT.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: "24", height: "24" },
            SP_REACT.createElement("path", { d: "M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.87 0-7-3.13-7-7V8.3l7-3.11 7 3.11V13c0 3.87-3.13 7-7 7zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" }))),
        onDismount() {
            log('=== Plugin dismounting ===');
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
