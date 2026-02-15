/**
 * GameTag Component
 * Displays a colored badge with icon for game tags
 */
import { VFC } from 'react';
import { GameTag as GameTagType } from '../types';
interface GameTagProps {
    tag: GameTagType | null;
    onClick?: () => void;
    compact?: boolean;
}
export declare const GameTag: VFC<GameTagProps>;
export {};
