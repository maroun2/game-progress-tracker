/**
 * TagManager Component
 * Modal for managing game tags manually
 */

import React, { FC, useState, useEffect } from 'react';
import { call } from '@decky/api';
import { GameDetails } from '../types';

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
      setError(err?.message || 'Failed to load game details');
      console.error('Error fetching game details:', err);
    } finally {
      setLoading(false);
    }
  };

  const setTag = async (tag: string) => {
    try {
      await call<[{ appid: string; tag: string }], void>('set_manual_tag', { appid, tag });
      await fetchDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to set tag');
      console.error('Error setting tag:', err);
    }
  };

  const resetToAuto = async () => {
    try {
      await call<[{ appid: string }], void>('reset_to_auto_tag', { appid });
      await fetchDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to reset tag');
      console.error('Error resetting tag:', err);
    }
  };

  const removeTag = async () => {
    try {
      await call<[{ appid: string }], void>('remove_tag', { appid });
      await fetchDetails();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove tag');
      console.error('Error removing tag:', err);
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
          <button onClick={onClose} style={styles.button}>Close</button>
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
        <h2 style={styles.title}>Manage Tags: {stats?.game_name || `Game ${appid}`}</h2>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Game Statistics</h3>
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
                <span>{hltb.matched_name} ({(hltb.similarity * 100).toFixed(0)}%)</span>
              </div>
              {hltb.main_extra && (
                <div style={styles.statRow}>
                  <span>Main+Extra:</span>
                  <span>{hltb.main_extra}h</span>
                </div>
              )}
            </>
          )}
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Current Tag</h3>
          <div style={styles.statRow}>
            {tag?.tag ? (
              <span>
                {tag.tag.replace('_', ' ').toUpperCase()}
                {tag.is_manual ? ' (Manual)' : ' (Automatic)'}
              </span>
            ) : (
              <span>No tag assigned</span>
            )}
          </div>
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Set Tag</h3>
          <div style={styles.buttonGroup}>
            <button onClick={() => setTag('completed')} style={styles.tagButton}>
              Completed
            </button>
            <button onClick={() => setTag('in_progress')} style={styles.tagButton}>
              In Progress
            </button>
            <button onClick={() => setTag('mastered')} style={styles.tagButton}>
              Mastered
            </button>
          </div>
          <div style={styles.buttonGroup}>
            <button onClick={resetToAuto} style={styles.secondaryButton}>
              Reset to Automatic
            </button>
            <button onClick={removeTag} style={styles.secondaryButton}>
              Remove Tag
            </button>
          </div>
        </div>

        <button onClick={onClose} style={styles.closeButton}>Close</button>
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
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    flexWrap: 'wrap',
  },
  tagButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#667eea',
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
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
