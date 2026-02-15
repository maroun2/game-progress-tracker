/**
 * React hook for managing game tags
 */
import { GameTag } from '../types';
export declare function useGameTag(appid: string): {
    tag: GameTag | null;
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    setManualTag: (newTag: string) => Promise<void>;
    removeTag: () => Promise<void>;
    resetToAuto: () => Promise<void>;
};
