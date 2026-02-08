/**
 * GameTag Component
 * Displays a colored badge for game tags
 */
import { VFC } from 'react';
import { GameTag as GameTagType } from '../types';
interface GameTagProps {
    tag: GameTagType | null;
    onClick?: () => void;
}
export declare const GameTag: VFC<GameTagProps>;
export {};
