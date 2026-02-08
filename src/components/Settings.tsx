/**
 * Settings Component
 * Plugin settings and configuration panel
 */

import React, { FC, useState, useEffect } from 'react';
import { call } from '@decky/api';
import { Navigation } from '@decky/ui';
import { PluginSettings, SyncResult, TagStatistics, TaggedGame, GameListResult } from '../types';

/**
 * Log to both console and backend (for debugging without CEF)
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
 * Get playtime data for a list of appids from Steam's frontend API
 * Uses window.appStore which is Steam's internal game data cache
 */
const getPlaytimeData = async (appids: string[]): Promise<Record<string, number>> => {
  await logToBackend('info', `getPlaytimeData called with ${appids.length} appids`);
  const playtimeMap: Record<string, number> = {};

  // Access Steam's global appStore (typed by @decky/ui)
  const appStore = (window as any).appStore;
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

  for (const appid of appids) {
    try {
      const overview = appStore.GetAppOverviewByAppID(parseInt(appid));
      if (overview) {
        const playtime = overview.minutes_playtime_forever || 0;
        playtimeMap[appid] = playtime;
        successCount++;
        if (playtime > 0) withPlaytime++;

        // Log first few for debugging
        if (successCount <= 3) {
          await logToBackend('info', `Sample - appid ${appid}: playtime=${playtime}min, name=${overview.display_name || 'unknown'}`);
        }
      } else {
        failCount++;
        if (failCount <= 3) {
          await logToBackend('info', `No overview for appid ${appid}`);
        }
      }
    } catch (e) {
      failCount++;
      await logToBackend('error', `Failed to get playtime for ${appid}: ${e}`);
    }
  }

  await logToBackend('info', `getPlaytimeData results: success=${successCount}, failed=${failCount}, withPlaytime=${withPlaytime}`);
  return playtimeMap;
};

// Tag color mapping
const TAG_COLORS: Record<string, string> = {
  completed: '#38ef7d',
  in_progress: '#764ba2',
  mastered: '#f5576c',
  backlog: '#888',
};

export const Settings: FC = () => {
  const [settings, setSettings] = useState<PluginSettings>({
    auto_tag_enabled: true,
    mastered_multiplier: 1.5,  // Deprecated, kept for compatibility
    in_progress_threshold: 30,
    cache_ttl: 7200
  });
  const [stats, setStats] = useState<TagStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Tagged games list state
  const [taggedGames, setTaggedGames] = useState<TaggedGame[]>([]);
  const [showTaggedList, setShowTaggedList] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);

  // Settings section state
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadSettings();
    loadStats();
    loadTaggedGames();  // Always load on mount
  }, []);

  const loadSettings = async () => {
    try {
      const result = await call<[], { settings: PluginSettings }>('get_settings');
      if (result.settings) {
        setSettings(result.settings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const loadStats = async () => {
    await logToBackend('info', 'loadStats called');
    try {
      const result = await call<[], { success: boolean; stats: TagStatistics }>('get_tag_statistics');
      await logToBackend('info', `loadStats result: ${JSON.stringify(result)}`);
      if (result.success && result.stats) {
        setStats(result.stats);
      }
    } catch (err) {
      await logToBackend('error', `loadStats error: ${err}`);
    }
  };

  const loadTaggedGames = async () => {
    await logToBackend('info', 'loadTaggedGames called');
    try {
      setLoadingGames(true);
      const result = await call<[], { success: boolean; games: TaggedGame[] }>('get_all_tags_with_names');
      await logToBackend('info', `loadTaggedGames result: success=${result.success}, games=${result.games?.length || 0}`);
      if (result.success && result.games) {
        setTaggedGames(result.games);
      }
    } catch (err) {
      await logToBackend('error', `loadTaggedGames error: ${err}`);
    } finally {
      setLoadingGames(false);
    }
  };

  const toggleTaggedList = () => {
    if (!showTaggedList && taggedGames.length === 0) {
      loadTaggedGames();
    }
    setShowTaggedList(!showTaggedList);
  };

  const navigateToGame = (appid: string) => {
    Navigation.Navigate(`/library/app/${appid}`);
    Navigation.CloseSideMenus();
  };

  const updateSetting = async (key: keyof PluginSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await call<[{ settings: PluginSettings }], void>('update_settings', { settings: newSettings });
      showMessage('Settings saved');
    } catch (err) {
      console.error('Error updating settings:', err);
      showMessage('Failed to save settings');
    }
  };

  const syncLibrary = async () => {
    await logToBackend('info', '========================================');
    await logToBackend('info', `syncLibrary button clicked - v${__PLUGIN_VERSION__}`);
    await logToBackend('info', '========================================');
    try {
      setSyncing(true);
      setMessage('Fetching game list...');

      // Step 1: Get all game appids from backend
      await logToBackend('info', 'Step 1: Calling backend get_all_games...');
      const gamesResult = await call<[], GameListResult>('get_all_games');
      await logToBackend('info', `get_all_games response: ${JSON.stringify(gamesResult).slice(0, 500)}`);

      if (!gamesResult.success || !gamesResult.games) {
        await logToBackend('error', `get_all_games failed: ${gamesResult.error}`);
        showMessage(`Failed to get game list: ${gamesResult.error || 'Unknown error'}`);
        return;
      }

      const appids = gamesResult.games.map(g => g.appid);
      await logToBackend('info', `Step 1 complete: Got ${appids.length} games from backend`);
      await logToBackend('info', `First 5 appids: ${appids.slice(0, 5).join(', ')}`);

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
      const result = await call<[{ playtime_data: Record<string, number> }], SyncResult>(
        'sync_library_with_playtime',
        { playtime_data: playtimeData }
      );
      await logToBackend('info', `Step 3 complete - sync result: ${JSON.stringify(result)}`);

      if (result.success) {
        showMessage(
          `Sync complete! ${result.synced}/${result.total} games synced. ` +
          (result.errors ? `${result.errors} errors.` : '')
        );
        await loadStats();
        await loadTaggedGames();
      } else {
        showMessage(`Sync failed: ${result.error}`);
      }
    } catch (err: any) {
      console.error('[GameProgressTracker] Error syncing library:', err);
      showMessage(`Sync error: ${err?.message || 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const refreshCache = async () => {
    try {
      setLoading(true);
      await call<[], void>('refresh_hltb_cache');
      showMessage('Cache will be refreshed on next sync');
    } catch (err) {
      console.error('Error refreshing cache:', err);
      showMessage('Failed to refresh cache');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string) => {
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
  }, {} as Record<string, TaggedGame[]>);

  const tagLabels: Record<string, string> = {
    mastered: 'Mastered (100% Achievements)',
    completed: 'Completed (Beat Main Story)',
    in_progress: 'In Progress',
  };

  const taggedCount = stats ? stats.completed + stats.in_progress + stats.mastered : 0;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Game Progress Tracker</h2>

      {message && (
        <div style={styles.message}>{message}</div>
      )}

      {/* Statistics - always visible */}
      {stats && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Library Statistics</h3>
          <div style={styles.statGrid}>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: TAG_COLORS.completed }}>
                {stats.completed}
              </div>
              <div style={styles.statLabel}>Completed</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: TAG_COLORS.in_progress }}>
                {stats.in_progress}
              </div>
              <div style={styles.statLabel}>In Progress</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: TAG_COLORS.mastered }}>
                {stats.mastered}
              </div>
              <div style={styles.statLabel}>Mastered</div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statValue, color: TAG_COLORS.backlog }}>
                {stats.backlog}
              </div>
              <div style={styles.statLabel}>Backlog</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Total Games</div>
            </div>
          </div>
        </div>
      )}

      {/* Tagged Games List */}
      <div style={styles.section}>
        <button
          onClick={toggleTaggedList}
          style={styles.expandButton}
        >
          {showTaggedList ? '- Hide' : '+ View'} All Tagged Games
          {` (${taggedCount} games)`}
        </button>

        {showTaggedList && (
          <div style={styles.taggedListContainer}>
            {loadingGames ? (
              <div style={styles.loadingText}>Loading games...</div>
            ) : taggedGames.length === 0 ? (
              <div style={styles.loadingText}>
                No tagged games yet. Click "Sync Entire Library" to tag your games based on playtime and achievements.
              </div>
            ) : (
              ['mastered', 'completed', 'in_progress'].map((tagType) => {
                const games = groupedGames[tagType] || [];
                if (games.length === 0) return null;

                return (
                  <div key={tagType} style={styles.tagGroup}>
                    <div style={styles.tagGroupHeader}>
                      <span
                        style={{
                          ...styles.tagDot,
                          backgroundColor: TAG_COLORS[tagType],
                        }}
                      />
                      {tagLabels[tagType]} ({games.length})
                    </div>
                    <div style={styles.gameList}>
                      {games.map((game) => (
                        <div
                          key={game.appid}
                          style={styles.gameItem}
                          onClick={() => navigateToGame(game.appid)}
                        >
                          <span
                            style={{
                              ...styles.smallDot,
                              backgroundColor: TAG_COLORS[game.tag],
                            }}
                          />
                          <span style={styles.gameName}>{game.game_name}</span>
                          {game.is_manual && (
                            <span style={styles.manualBadge}>manual</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Sync Button - always visible */}
      <div style={styles.section}>
        <button
          onClick={syncLibrary}
          disabled={syncing || loading}
          style={syncing ? styles.buttonDisabled : styles.button}
        >
          {syncing ? 'Syncing...' : 'Sync Entire Library'}
        </button>
        <div style={styles.hint}>
          Sync may take several minutes for large libraries
        </div>
      </div>

      {/* Settings - collapsible */}
      <div style={styles.section}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={styles.expandButton}
        >
          {showSettings ? '- Hide' : '+ Show'} Settings
        </button>

        {showSettings && (
          <div style={styles.settingsContainer}>
            {/* Auto-tagging Settings */}
            <div style={styles.settingGroup}>
              <h4 style={styles.settingGroupTitle}>Automatic Tagging</h4>
              <div style={styles.settingRow}>
                <label style={styles.label}>
                  <input
                    type="checkbox"
                    checked={settings.auto_tag_enabled}
                    onChange={(e) => updateSetting('auto_tag_enabled', e.target.checked)}
                    style={styles.checkbox}
                  />
                  Enable Auto-Tagging
                </label>
              </div>
            </div>

            {/* Tag Rules Info */}
            <div style={styles.settingGroup}>
              <h4 style={styles.settingGroupTitle}>Tag Rules</h4>
              <div style={styles.tagRulesInfo}>
                <div style={styles.tagRule}>
                  <span style={{ ...styles.tagDot, backgroundColor: TAG_COLORS.mastered }} />
                  <strong>Mastered:</strong> 100% achievements unlocked
                </div>
                <div style={styles.tagRule}>
                  <span style={{ ...styles.tagDot, backgroundColor: TAG_COLORS.completed }} />
                  <strong>Completed:</strong> Playtime ≥ main story time (from HLTB)
                </div>
                <div style={styles.tagRule}>
                  <span style={{ ...styles.tagDot, backgroundColor: TAG_COLORS.in_progress }} />
                  <strong>In Progress:</strong> Playtime ≥ {settings.in_progress_threshold} minutes
                </div>
              </div>

              <div style={styles.settingRow}>
                <label style={styles.label}>
                  In Progress Threshold: {settings.in_progress_threshold} minutes
                </label>
                <input
                  type="range"
                  min="15"
                  max="120"
                  step="15"
                  value={settings.in_progress_threshold}
                  onChange={(e) => updateSetting('in_progress_threshold', parseInt(e.target.value))}
                  style={styles.slider}
                />
                <div style={styles.hint}>
                  Minimum playtime to mark as In Progress
                </div>
              </div>
            </div>

            {/* Cache Management */}
            <div style={styles.settingGroup}>
              <h4 style={styles.settingGroupTitle}>Cache</h4>
              <button
                onClick={refreshCache}
                disabled={syncing || loading}
                style={styles.buttonSecondary}
              >
                Refresh HLTB Cache
              </button>
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>About</h3>
        <div style={styles.about}>
          <p>Game Progress Tracker v{__PLUGIN_VERSION__}</p>
          <p>Automatic game tagging based on achievements, playtime, and completion time.</p>
          <p style={styles.smallText}>
            Data from HowLongToBeat • Steam achievement system
          </p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
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
};
