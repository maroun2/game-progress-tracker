/**
 * TagManager Component
 * Modal for managing game tags manually
 */

import React, { FC, useState, useEffect } from 'react';
import { call } from '@decky/api';
import { Focusable, DialogButton } from '@decky/ui';
import { GameDetails } from '../types';
import { TagIcon, TAG_ICON_COLORS } from './TagIcon';

interface TagManagerProps {
  appid: string;
  onClose: () => void;
}

export const TagManager: FC<TagManagerProps> = ({ appid, onClose }) => {
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDetails();
  }, [appid]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await call<[{ appid: string }], GameDetails>('get_game_details', { appid });
      setDetails(result);
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to load game details';
      setError(errorMsg);
      // Error occurred
    } finally {
      setLoading(false);
    }
  };

  const setTag = async (tag: string) => {
    try {
      const result = await call<[{ appid: string; tag: string }], { success: boolean; error?: string }>('set_manual_tag', { appid, tag });
      await fetchDetails();
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to set tag';
      setError(errorMsg);
      // Error occurred
    }
  };

  const resetToAuto = async () => {
    try {
      const result = await call<[{ appid: string }], { success: boolean; error?: string }>('reset_to_auto_tag', { appid });
      await fetchDetails();
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to reset tag';
      setError(errorMsg);
      // Error occurred
    }
  };

  const removeTag = async () => {
    try {
      const result = await call<[{ appid: string }], { success: boolean; error?: string }>('remove_tag', { appid });
      await fetchDetails();
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to remove tag';
      setError(errorMsg);
      // Error occurred
    }
  };

  if (loading) {
    return (
      <div style={styles.modal}>
        <div style={styles.content}>
          <div style={styles.loading}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !details || !details.success) {
    return (
      <div style={styles.modal}>
        <div style={styles.content}>
          <div style={styles.error}>{error || 'Failed to load game details'}</div>
          <Focusable>
            <DialogButton onClick={onClose}>Close</DialogButton>
          </Focusable>
        </div>
      </div>
    );
  }

  const stats = details.stats;
  const tag = details.tag;
  const hltb = details.hltb_data;

  return (
    <div style={styles.modal} onClick={onClose}>
      <div style={styles.content} onClick={(e) => e.stopPropagation()}>
        {/* Header: Game name with current tag */}
        <div style={styles.header}>
          <h2 style={styles.title}>{stats?.game_name || `Game ${appid}`}</h2>
          {tag?.tag && (
            <div style={styles.currentTagBadge}>
              <TagIcon type={tag.tag as any} size={20} />
              <span style={{ color: TAG_ICON_COLORS[tag.tag as keyof typeof TAG_ICON_COLORS] }}>
                {tag.tag.replace('_', ' ').toUpperCase()}
              </span>
              <span style={styles.tagType}>
                {tag.is_manual ? '(Manual)' : '(Auto)'}
              </span>
            </div>
          )}
        </div>

        {/* Main content: Statistics and Tag buttons side by side */}
        <div style={styles.mainContent}>
          {/* Left side: Statistics */}
          <div style={styles.leftColumn}>
            <h3 style={styles.sectionTitle}>Statistics</h3>
            {stats && (
              <>
                <div style={styles.statRow}>
                  <span>Playtime:</span>
                  <span>{Math.floor(stats.playtime_minutes / 60)}h {stats.playtime_minutes % 60}m</span>
                </div>
                <div style={styles.statRow}>
                  <span>Achievements:</span>
                  <span>{stats.unlocked_achievements}/{stats.total_achievements}</span>
                </div>
              </>
            )}
            {hltb && (
              <>
                <div style={styles.statRow}>
                  <span>HLTB Match:</span>
                  <span style={styles.hltbMatch}>
                    {hltb.matched_name} ({Math.round((hltb.similarity || 0) * 100)}%)
                  </span>
                </div>
                {hltb.main_story && (
                  <div style={styles.statRow}>
                    <span>Main Story:</span>
                    <span>{hltb.main_story}h</span>
                  </div>
                )}
              </>
            )}
            {!hltb && (
              <div style={styles.statRow}>
                <span>HLTB:</span>
                <span style={styles.noData}>No data</span>
              </div>
            )}
          </div>

          {/* Right side: Tag buttons */}
          <div style={styles.rightColumn}>
            <h3 style={styles.sectionTitle}>Set Tag</h3>
            <Focusable style={styles.tagButtonGroup} flow-children="down">
              <Focusable
                onActivate={() => setTag('mastered')}
                style={{ ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.mastered }}
              >
                <TagIcon type="mastered" size={18} />
                <span>Mastered</span>
              </Focusable>
              <Focusable
                onActivate={() => setTag('completed')}
                style={{ ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.completed }}
              >
                <TagIcon type="completed" size={18} />
                <span>Completed</span>
              </Focusable>
              <Focusable
                onActivate={() => setTag('in_progress')}
                style={{ ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.in_progress }}
              >
                <TagIcon type="in_progress" size={18} />
                <span>In Progress</span>
              </Focusable>
              <Focusable
                onActivate={() => setTag('dropped')}
                style={{ ...styles.tagButton, backgroundColor: TAG_ICON_COLORS.dropped }}
              >
                <TagIcon type="dropped" size={18} />
                <span>Dropped</span>
              </Focusable>
            </Focusable>
            <Focusable style={styles.buttonGroup} flow-children="horizontal">
              <DialogButton onClick={resetToAuto} style={styles.secondaryButton}>
                Reset to Auto
              </DialogButton>
              <DialogButton onClick={removeTag} style={styles.secondaryButton}>
                Remove
              </DialogButton>
            </Focusable>
          </div>
        </div>

        <Focusable>
          <DialogButton onClick={onClose} style={styles.closeButton}>Close</DialogButton>
        </Focusable>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
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
