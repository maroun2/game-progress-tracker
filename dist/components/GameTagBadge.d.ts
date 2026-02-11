/**
 * GameTagBadge Component
 * Wrapper component for displaying game tag on library app page
 * Designed to be injected via safe route patching
 */
import { FC } from 'react';
interface GameTagBadgeProps {
    appid: string;
}
/**
 * GameTagBadge - Main component injected into library app page
 * Shows tag badge or "Add Tag" button, with TagManager modal
 */
export declare const GameTagBadge: FC<GameTagBadgeProps>;
export {};
