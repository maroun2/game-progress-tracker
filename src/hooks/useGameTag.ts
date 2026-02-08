/**
 * React hook for managing game tags
 */

import { useState, useEffect } from 'react';
import { call } from '@decky/api';
import { GameTag } from '../types';

export function useGameTag(appid: string) {
  const [tag, setTag] = useState<GameTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTag();
  }, [appid]);

  const fetchTag = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await call<[{ appid: string }], { tag: GameTag }>('get_game_tag', { appid });
      setTag(result.tag);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch tag');
      console.error('Error fetching tag:', err);
    } finally {
      setLoading(false);
    }
  };

  const setManualTag = async (newTag: string) => {
    try {
      setError(null);

      const result = await call<[{ appid: string; tag: string }], { success: boolean; error?: string }>('set_manual_tag', { appid, tag: newTag });

      if (result.success) {
        await fetchTag();
      } else {
        setError(result.error || 'Failed to set tag');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to set tag');
      console.error('Error setting tag:', err);
    }
  };

  const removeTag = async () => {
    try {
      setError(null);

      const result = await call<[{ appid: string }], { success: boolean; error?: string }>('remove_tag', { appid });

      if (result.success) {
        await fetchTag();
      } else {
        setError(result.error || 'Failed to remove tag');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to remove tag');
      console.error('Error removing tag:', err);
    }
  };

  const resetToAuto = async () => {
    try {
      setError(null);

      const result = await call<[{ appid: string }], { success: boolean; error?: string }>('reset_to_auto_tag', { appid });

      if (result.success) {
        await fetchTag();
      } else {
        setError(result.error || 'Failed to reset tag');
      }
    } catch (err: any) {
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
