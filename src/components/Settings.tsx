import React, { FC, useState, useEffect, useRef } from 'react';
import { call, toaster } from '@decky/api';
import { PanelSection, PanelSectionRow, ButtonItem, Navigation } from '@decky/ui';
import { PluginSettings, SyncResult, TagStatistics, TaggedGame, GameListResult } from '../types';
import { TagIcon, TagType } from './TagIcon';
import { syncLibraryProgressive } from '../lib/syncUtils';

const logToBackend = async (level: 'info' | 'error' | 'warn', message: string) => {
  console.log(`[DeckProgressTracker] ${message}`);
  try {
    await call('log_frontend', { level, message });
  } catch (e) {}
};

const TAG_COLORS: Record<string, string> = {
  completed: '#38ef7d',
  in_progress: '#764ba2',
  mastered: '#f5576c',
  backlog: '#888',
  dropped: '#c9a171',
};

const TAG_LABELS: Record<string, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  backlog: 'Backlog',
  mastered: 'Mastered',
  dropped: 'Dropped',
};

const TAG_DESCRIPTIONS: Record<string, string> = {
  completed: 'Beat the main story (playtime ≥ HLTB main story time)',
  in_progress: 'Currently playing (playtime ≥ 30 minutes)',
  backlog: 'Not started yet (no playtime or minimal playtime)',
  mastered: 'Unlocked 85%+ of all achievements',
  dropped: 'Not played for over 1 year',
};

export const Settings: FC = () => {
  const [settings, setSettings] = useState<PluginSettings>({
    auto_tag_enabled: true,
    mastered_multiplier: 1.5,
    in_progress_threshold: 30,
    cache_ttl: 7200,
    source_installed: true,
    source_non_steam: true,
    source_all_owned: true,
  });

  const [stats, setStats] = useState<TagStatistics | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [taggedGames, setTaggedGames] = useState<TaggedGame[]>([]);
  const [backlogGames, setBacklogGames] = useState<TaggedGame[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingBacklog, setLoadingBacklog] = useState(false);

  const prevStatsRef = useRef<string>('');
  const prevGamesRef = useRef<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  const smartUpdateUI = async () => {
    try {
      const statsResult = await call<[], { success: boolean; stats: TagStatistics }>('get_tag_statistics');
      if (statsResult.success && JSON.stringify(statsResult.stats) !== prevStatsRef.current) {
        prevStatsRef.current = JSON.stringify(statsResult.stats);
        setStats(statsResult.stats);
      }

      const gamesResult = await call<[], { success: boolean; games: TaggedGame[] }>('get_all_tags_with_names');
      if (gamesResult.success) {
        const fingerPrint = JSON.stringify(gamesResult.games.map(g => g.appid).sort());
        if (fingerPrint !== prevGamesRef.current) {
          prevGamesRef.current = fingerPrint;
          setTaggedGames(gamesResult.games);
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    // Scroll to top when component mounts
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ block: 'start' });
    }

    call<[], { settings: PluginSettings }>('get_settings').then(res => res.settings && setSettings(res.settings));
    smartUpdateUI();
    const interval = setInterval(smartUpdateUI, 10000);
    return () => clearInterval(interval);
  }, []);

  // Track if we're waiting for backend to start (during data collection phase)
  const [waitingForBackend, setWaitingForBackend] = useState(false);

  useEffect(() => {
    const pollSync = async () => {
      try {
        const res = await call<[], { success: boolean; syncing: boolean; current: number; total: number }>('get_sync_progress');

        if (res.success && res.syncing) {
          // Backend is syncing - always show progress regardless of frontend state
          // This handles sync from any source (manual, auto, initial load)
          setMessage(`Syncing: ${res.current}/${res.total} games`);
          setSyncing(true);
          setWaitingForBackend(false);
        } else if (res.success && !res.syncing && syncing) {
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
      } catch (err) {}
    };
    const interval = setInterval(pollSync, syncing ? 500 : 2000);
    return () => clearInterval(interval);
  }, [syncing, waitingForBackend]);

  const toggleSection = async (tagType: string) => {
    const willExpand = !expandedSections[tagType];
    setExpandedSections(prev => ({ ...prev, [tagType]: willExpand }));

    if (tagType === 'backlog' && willExpand && backlogGames.length === 0) {
      setLoadingBacklog(true);
      const res = await call<[], { success: boolean; games: TaggedGame[] }>('get_backlog_games');
      if (res.success) setBacklogGames(res.games);
      setLoadingBacklog(false);
    }
  };

  const syncLibrary = async () => {
    try {
      setSyncing(true);
      setWaitingForBackend(false);  // No longer waiting since we process immediately
      setMessage('Starting sync...');

      // Use progressive sync with progress callback
      const result = await syncLibraryProgressive((current, total, gameName) => {
        // Update message with current game being processed
        if (gameName) {
          setMessage(`Syncing ${current}/${total}: ${gameName}`);
        } else {
          setMessage(`Syncing ${current}/${total} games...`);
        }

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
    } catch (err: any) {
      setMessage(`Sync error: ${err?.message || 'Unknown'}`);
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
      setWaitingForBackend(false);
    }
  };

  const groupedGames = taggedGames.reduce((acc, g) => {
    if (!acc[g.tag]) acc[g.tag] = [];
    acc[g.tag].push(g);
    return acc;
  }, {} as Record<string, TaggedGame[]>);

  return (
    <div ref={containerRef} style={styles.container}>
      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Library ({stats?.total || 0} games)</h3>
        <PanelSection>
          {(['in_progress', 'completed', 'mastered', 'dropped', 'backlog'] as TagType[]).map(tagType => {
            const isBacklog = tagType === 'backlog';
            const games = isBacklog ? backlogGames : (groupedGames[tagType] || []);
            const count = isBacklog ? (stats?.backlog || 0) : games.length;
            const isExpanded = !!expandedSections[tagType];

            return (
              <React.Fragment key={tagType}>
                <PanelSectionRow>
                  <ButtonItem layout="below" onClick={() => toggleSection(tagType)}>
                    <div style={styles.tagSectionContent}>
                      <div style={styles.tagSectionLeft}>
                        <TagIcon type={tagType} size={18} />
                        <span style={styles.tagSectionTitle}>{TAG_LABELS[tagType]}</span>
                      </div>
                      <div style={styles.tagSectionRight}>
                        <span style={{ ...styles.tagCount, color: TAG_COLORS[tagType] }}>{count}</span>
                        <span style={styles.expandIcon}>{isExpanded ? '−' : '+'}</span>
                      </div>
                    </div>
                  </ButtonItem>
                </PanelSectionRow>

                {isExpanded && <div style={styles.tagDescription}>{TAG_DESCRIPTIONS[tagType]}</div>}
                
                {isExpanded && games.length > 0 && games.map(game => (
                  <PanelSectionRow key={game.appid}>
                    <ButtonItem
                      layout="below"
                      onClick={() => { Navigation.Navigate(`/library/app/${game.appid}`); Navigation.CloseSideMenus(); }}
                      style={{ width: '100%', overflow: 'hidden' }}
                    >
                      <div style={{ display: 'table', tableLayout: 'fixed', width: '100%' }}>
                        <div style={styles.gameItemContent}>
                          <span style={{ ...styles.smallDot, backgroundColor: TAG_COLORS[game.tag] }} />
                          <span style={styles.gameName}>{game.game_name}</span>
                          {game.is_manual && <span style={styles.manualBadge}>manual</span>}
                        </div>
                      </div>
                    </ButtonItem>
                  </PanelSectionRow>
                ))}
                {isExpanded && games.length === 0 && !loadingBacklog && <div style={styles.emptySection}>No games found</div>}
              </React.Fragment>
            );
          })}
        </PanelSection>
      </div>

      <PanelSection>
        <PanelSectionRow>
          <ButtonItem layout="below" onClick={syncLibrary} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Entire Library'}
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>About</h3>
        <div style={styles.about}>
          <p style={styles.aboutLine}>Game Progress Tracker v{__PLUGIN_VERSION__}</p>
          <p style={styles.aboutLine}>Data from HowLongToBeat & Steam</p>
          <p style={styles.donationText}>Donations are appreciated</p>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
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