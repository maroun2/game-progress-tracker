/**
 * Settings Component
 * Plugin settings and configuration panel
 */

import React, { FC, useState, useEffect } from 'react';
import { call } from '@decky/api';
import { Navigation } from '@decky/ui';
import { PluginSettings, SyncResult, TagStatistics, TaggedGame, GameListResult } from '../types';
import { TagIcon, TagType } from './TagIcon';
import { getAchievementData, getPlaytimeData, AchievementData } from '../lib/syncUtils';

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
};

export const Settings: FC = () => {
  const [settings, setSettings] = useState<PluginSettings>({
    auto_tag_enabled: true,
    mastered_multiplier: 1.5,  // Deprecated, kept for compatibility
    in_progress_threshold: 30,
    cache_ttl: 7200,
    source_installed: true,
    source_non_steam: true,
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
  });
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingBacklog, setLoadingBacklog] = useState(false);

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

      // Step 2.5: Get achievement data from Steam frontend API
      await logToBackend('info', 'Step 2.5: Getting achievement data from Steam frontend API...');
      setMessage(`Getting achievement data for ${appids.length} games...`);
      const achievementData = await getAchievementData(appids);
      const gamesWithAchievements = Object.values(achievementData).filter(v => v.total > 0).length;
      await logToBackend('info', `Step 2.5 complete: Got achievements for ${gamesWithAchievements}/${appids.length} games`);

      // Log sample of achievement data
      const achievementSample = Object.entries(achievementData).slice(0, 5);
      await logToBackend('info', `Sample achievement data: ${JSON.stringify(achievementSample)}`);

      // Step 3: Sync with playtime and achievement data
      await logToBackend('info', 'Step 3: Calling backend sync_library_with_playtime...');
      await logToBackend('info', `Sending ${Object.keys(playtimeData).length} playtime entries and ${Object.keys(achievementData).length} achievement entries to backend`);
      setMessage('Syncing library... This may take several minutes.');
      const result = await call<[{ playtime_data: Record<string, number>; achievement_data: Record<string, AchievementData> }], SyncResult>(
        'sync_library_with_playtime',
        { playtime_data: playtimeData, achievement_data: achievementData }
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
    completed: 'Completed (Beat Main Story)',
    in_progress: 'In Progress',
    backlog: 'Backlog (Not Started)',
    mastered: 'Mastered (85%+ Achievements)',
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
      <h2 style={styles.title}>Game Progress Tracker</h2>

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
          <div style={styles.taggedListContainer}>
            {(['in_progress', 'completed', 'mastered', 'backlog'] as TagType[]).map((tagType) => {
              if (!tagType) return null;
              const isBacklog = tagType === 'backlog';
              const games = isBacklog ? backlogGames : (groupedGames[tagType] || []);
              const count = getCategoryCount(tagType);
              const isExpanded = expandedSections[tagType];

              return (
                <div key={tagType} style={styles.tagSection}>
                  <button
                    onClick={() => toggleSection(tagType)}
                    style={styles.tagSectionHeader}
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
                  </button>

                  {isExpanded && isBacklog && loadingBacklog && (
                    <div style={styles.emptySection}>Loading backlog games...</div>
                  )}

                  {isExpanded && games.length > 0 && (
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
                  )}

                  {isExpanded && games.length === 0 && !loadingBacklog && (
                    <div style={styles.emptySection}>No games with this tag</div>
                  )}
                </div>
              );
            })}
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
                  <TagIcon type="mastered" size={16} />
                  <strong>Mastered:</strong> 85%+ achievements unlocked
                </div>
                <div style={styles.tagRule}>
                  <TagIcon type="completed" size={16} />
                  <strong>Completed:</strong> Playtime ≥ main story time (from HLTB)
                </div>
                <div style={styles.tagRule}>
                  <TagIcon type="in_progress" size={16} />
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

            {/* Game Sources */}
            <div style={styles.settingGroup}>
              <h4 style={styles.settingGroupTitle}>Game Sources</h4>
              <div style={styles.hint}>
                Select which games to include when syncing
              </div>
              <div style={styles.settingRow}>
                <label style={styles.label}>
                  <input
                    type="checkbox"
                    checked={settings.source_installed}
                    onChange={(e) => updateSetting('source_installed', e.target.checked)}
                    style={styles.checkbox}
                  />
                  Installed Steam Games
                </label>
              </div>
              <div style={styles.settingRow}>
                <label style={styles.label}>
                  <input
                    type="checkbox"
                    checked={settings.source_non_steam}
                    onChange={(e) => updateSetting('source_non_steam', e.target.checked)}
                    style={styles.checkbox}
                  />
                  Non-Steam Games (Shortcuts)
                </label>
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
