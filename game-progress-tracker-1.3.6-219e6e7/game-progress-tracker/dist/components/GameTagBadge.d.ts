/**
 * GameTagBadge Component
 * Wrapper component for displaying game tag on library app page
 * Designed to be injected via safe route patching
 * Uses same positioning pattern as ProtonDB Badges
 */
import { FC } from 'react';
interface GameTagBadgeProps {
    appid: string;
}
/**
 * GameTagBadge - Main component injected into library app page
 * Shows tag badge or "Add Tag" button, with TagManager modal
 * Positions on opposite side of ProtonDB (top-right vs their top-left default)
 */
export declare const GameTagBadge: FC<GameTagBadgeProps>;
export {};
