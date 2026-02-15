/**
 * Settings Component
 * Plugin settings and configuration panel
 */

import React, { FC, useState, useEffect } from 'react';
import { call, toaster } from '@decky/api';
import { PanelSection, PanelSectionRow, ButtonItem, Focusable, Navigation } from '@decky/ui';
import { PluginSettings, SyncResult, TagStatistics, TaggedGame, GameListResult } from '../types';
import { TagIcon, TagType } from './TagIcon';
import { getAchievementData, getPlaytimeData, getGameNames, getAllOwnedGameIds, AchievementData } from '../lib/syncUtils';

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

// Tag color mapping
const TAG_COLORS: Record<string, string> = {
  completed: '#38ef7d',
  in_progress: '#764ba2',
  mastered: '#f5576c',
  backlog: '#888',
  dropped: '#c9a171',
};

export const Settings: FC = () => {
  const [settings, setSettings] = useState<PluginSettings>({
    auto_tag_enabled: true,
    mastered_multiplier: 1.5,  // Deprecated, kept for compatibility
    in_progress_threshold: 30,
    cache_ttl: 7200,
    source_installed: true,
    source_non_steam: true,
    source_all_owned: true,
  });
  const [stats, setStats] = useState<TagStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Tagged games list state
  const [taggedGames, setTaggedGames] = useState<TaggedGame[]>([]);
  const [backlogGames, setBacklogGames] = useState<TaggedGame[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    completed: false,
    in_progress: false,
    backlog: false,
    mastered: false,
    dropped: false,
  });
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingBacklog, setLoadingBacklog] = useState(false);

  // Settings section state
  const [showSettings, setShowSettings] = useState(false);

  // Track previous data to avoid unnecessary re-renders (prevents UI flashing)
  const prevStatsRef = React.useRef<string>('');
  const prevGamesRef = React.useRef<string>('');

  // Smart update function that only updates UI if data changed
  const smartUpdateUI = async () => {
    try {
      // Fetch stats
      const statsResult = await call<[], { success: boolean; stats: TagStatistics }>('get_tag_statistics');
      if (statsResult.success && statsResult.stats) {
        const newStatsStr = JSON.stringify(statsResult.stats);
        if (newStatsStr !== prevStatsRef.current) {
          prevStatsRef.current = newStatsStr;
          setStats(statsResult.stats);
        }
      }

      // Fetch games
      const gamesResult = await call<[], { success: boolean; games: TaggedGame[] }>('get_all_tags_with_names');
      if (gamesResult.success && gamesResult.games) {
        const newGamesStr = JSON.stringify(gamesResult.games.map(g => g.appid).sort());
        if (newGamesStr !== prevGamesRef.current) {
          prevGamesRef.current = newGamesStr;
          setTaggedGames(gamesResult.games);
          // No notification here - notifications only shown after explicit sync complete
        }
      }
    } catch (err) {
      // Silently fail
    }
  };

  // Poll for sync progress from backend (works for both auto-sync and manual sync)
  useEffect(() => {
    const pollSyncProgress = async () => {
      try {
        const result = await call<[], { success: boolean; syncing: boolean; current: number; total: number }>('get_sync_progress');
        if (result.success && result.syncing) {
          // Update message with current progress
          setMessage(`Syncing: ${result.current}/${result.total} games`);
          setSyncing(true);
        } else if (result.success && !result.syncing && syncing) {
          // Sync just finished
          setSyncing(false);
          // Update UI to show new tags
          smartUpdateUI();
        }
      } catch (err) {
        // Silently fail - backend may not support get_sync_progress yet
      }
    };

    // Poll every 500ms when syncing, less frequently otherwise
    const interval = setInterval(pollSyncProgress, syncing ? 500 : 2000);
    return () => clearInterval(interval);
  }, [syncing]);

  useEffect(() => {
    loadSettings();
    // Initial load - force update
    loadStats().then(() => {
      if (stats) prevStatsRef.current = JSON.stringify(stats);
    });
    loadTaggedGames().then(() => {
      if (taggedGames.length > 0) prevGamesRef.current = JSON.stringify(taggedGames.map(g => g.appid).sort());
    });

    // Poll every 10 seconds for updates (from background sync or other sources)
    const pollInterval = setInterval(smartUpdateUI, 10000);

    return () => clearInterval(pollInterval);
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

  const loadBacklogGames = async () => {
    await logToBackend('info', 'loadBacklogGames called');
    try {
      setLoadingBacklog(true);
      const result = await call<[], { success: boolean; games: TaggedGame[] }>('get_backlog_games');
      await logToBackend('info', `loadBacklogGames result: success=${result.success}, games=${result.games?.length || 0}`);
      if (result.success && result.games) {
        setBacklogGames(result.games);
      }
    } catch (err) {
      await logToBackend('error', `loadBacklogGames error: ${err}`);
    } finally {
      setLoadingBacklog(false);
    }
  };

  const toggleSection = (tagType: string) => {
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

      let appids: string[];

      // Check if we should use all owned games from frontend or backend discovery
      if (settings.source_all_owned) {
        // Step 1: Get all owned games from Steam frontend API
        await logToBackend('info', 'Step 1: Getting ALL owned games from Steam frontend API...');
        appids = await getAllOwnedGameIds();
        await logToBackend('info', `getAllOwnedGameIds returned ${appids.length} games`);

        if (appids.length === 0) {
          await logToBackend('warn', 'Frontend discovery returned 0 games, falling back to backend...');
          const gamesResult = await call<[], GameListResult>('get_all_games');
          if (gamesResult.success && gamesResult.games) {
            appids = gamesResult.games.map(g => g.appid);
            await logToBackend('info', `Backend fallback: Got ${appids.length} games`);
          } else {
            await logToBackend('error', `Both frontend and backend discovery failed`);
            showMessage('Failed to discover games. Please try again.');
            return;
          }
        }
      } else {
        // Step 1: Get game appids from backend (installed games only)
        await logToBackend('info', 'Step 1: Calling backend get_all_games...');
        const gamesResult = await call<[], GameListResult>('get_all_games');
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

      const result = await call<[{ game_data: Record<string, import('../lib/syncUtils').GameData>; achievement_data: Record<string, AchievementData>; game_names: Record<string, string> }], SyncResult>(
        'sync_library_with_playtime',
        { game_data: gameData, achievement_data: achievementData, game_names: gameNames }
      );

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
    completed: 'Completed',
    in_progress: 'In Progress',
    backlog: 'Backlog',
    mastered: 'Mastered',
    dropped: 'Dropped',
  };

  const tagDescriptions: Record<string, string> = {
    completed: 'Beat the main story (playtime ≥ HLTB main story time)',
    in_progress: 'Currently playing (playtime ≥ 30 minutes)',
    backlog: 'Not started yet (no playtime or minimal playtime)',
    mastered: 'Unlocked 85%+ of all achievements',
    dropped: 'Not played for over 1 year',
  };

  const totalGames = stats ? stats.total : 0;

  // Get count for each category including backlog from stats
  const getCategoryCount = (tagType: string): number => {
    if (tagType === 'backlog') {
      return stats?.backlog || 0;
    }
    return (groupedGames[tagType] || []).length;
  };

  return (
    <div style={styles.container}>
      <style>{`
        /* Subtle Steam-like focus styling - only highlights the actual focused element */
        .gpfocus {
          outline: 1px solid rgba(76, 154, 255, 0.8) !important;
          outline-offset: 2px;
          background-color: rgba(76, 154, 255, 0.1) !important;
          transition: all 0.15s ease-in-out;
        }
      `}</style>
      {message && (
        <div style={styles.message}>{message}</div>
      )}

      {/* Game Lists - Expandable per tag type */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Library ({totalGames} games)</h3>

        {loadingGames ? (
          <div style={styles.loadingText}>Loading games...</div>
        ) : totalGames === 0 ? (
          <div style={styles.loadingText}>
            No games synced yet. Click "Sync Entire Library" to tag your games based on playtime and achievements.
          </div>
        ) : (
          <Focusable style={styles.taggedListContainer} flow-children="down">
            {(['in_progress', 'completed', 'mastered', 'dropped', 'backlog'] as TagType[]).map((tagType) => {
              if (!tagType) return null;
              const isBacklog = tagType === 'backlog';
              const games = isBacklog ? backlogGames : (groupedGames[tagType] || []);
              const count = getCategoryCount(tagType);
              const isExpanded = expandedSections[tagType];

              return (
                <Focusable key={tagType} style={styles.tagSection} flow-children="down">
                  <Focusable
                    style={styles.tagSectionHeader}
                    onActivate={() => toggleSection(tagType)}
                  >
                    <div style={styles.tagSectionLeft}>
                      <TagIcon type={tagType} size={18} />
                      <span style={styles.tagSectionTitle}>{tagLabels[tagType]}</span>
                    </div>
                    <div style={styles.tagSectionRight}>
                      <span style={{ ...styles.tagCount, color: TAG_COLORS[tagType] }}>
                        {count}
                      </span>
                      <span style={styles.expandIcon}>
                        {isExpanded ? '−' : '+'}
                      </span>
                    </div>
                  </Focusable>

                  {isExpanded && (
                    <div style={styles.tagDescription}>
                      {tagDescriptions[tagType]}
                    </div>
                  )}

                  {isExpanded && isBacklog && loadingBacklog && (
                    <div style={styles.emptySection}>Loading backlog games...</div>
                  )}

                  {isExpanded && games.length > 0 && (
                    <Focusable style={styles.gameList} flow-children="down">
                      {games.map((game) => (
                        <Focusable
                          key={game.appid}
                          style={styles.gameItem}
                          onActivate={() => navigateToGame(game.appid)}
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
                        </Focusable>
                      ))}
                    </Focusable>
                  )}

                  {isExpanded && games.length === 0 && !loadingBacklog && (
                    <div style={styles.emptySection}>No games with this tag</div>
                  )}
                </Focusable>
              );
            })}
          </Focusable>
        )}
      </div>

      {/* Sync Button - always visible */}
      <PanelSection>
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={syncLibrary}
            disabled={syncing || loading}
          >
            {syncing ? 'Syncing...' : 'Sync Entire Library'}
          </ButtonItem>
        </PanelSectionRow>
        <div style={styles.hint}>
          Sync may take several minutes for large libraries
        </div>
      </PanelSection>

      {/* About */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>About</h3>
        <div style={styles.about}>
          <p>Game Progress Tracker {__PLUGIN_VERSION__}</p>
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
    border: '2px solid transparent',
    transition: 'all 0.2s',
  },
  gameItemFocused: {
    backgroundColor: '#2a3f5f',
    borderColor: '#4c9aff',
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
    border: '2px solid transparent',
    borderRadius: '0',
    color: 'white',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.2s',
  },
  tagSectionHeaderFocused: {
    backgroundColor: '#2a3f5f',
    borderColor: '#4c9aff',
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
