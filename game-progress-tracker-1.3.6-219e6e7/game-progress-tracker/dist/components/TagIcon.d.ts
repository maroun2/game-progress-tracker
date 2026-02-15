import { FC } from 'react';
export type TagType = 'mastered' | 'completed' | 'in_progress' | 'backlog' | 'dropped' | null;
interface TagIconProps {
    type: TagType;
    size?: number;
    className?: string;
}
export declare const TAG_ICON_COLORS: {
    mastered: string;
    completed: string;
    in_progress: string;
    backlog: string;
    dropped: string;
};
/**
 * TagIcon component - displays appropriate icon based on tag type
 */
export declare const TagIcon: FC<TagIconProps>;
export default TagIcon;
