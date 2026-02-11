/**
 * GameTag Component
 * Displays a colored badge with icon for game tags
 */

import React, { VFC, CSSProperties } from 'react';
import { GameTag as GameTagType } from '../types';
import { TagIcon, TAG_ICON_COLORS } from './TagIcon';

// Debug logging helper
const log = (msg: string, data?: any) => {
  const logMsg = `[GameProgressTracker][GameTag] ${msg}`;
  if (data !== undefined) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
};

interface GameTagProps {
  tag: GameTagType | null;
  onClick?: () => void;
  compact?: boolean;  // For grid view - shows only icon
}

interface TagStyle {
  background: string;
  label: string;
}

const TAG_STYLES: Record<string, TagStyle> = {
  completed: {
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    label: 'Completed'
  },
  in_progress: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    label: 'In Progress'
  },
  mastered: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    label: 'Mastered'
  }
};

export const GameTag: VFC<GameTagProps> = ({ tag, onClick, compact = false }) => {
  log(`GameTag render: tag=${tag?.tag || 'null'}, compact=${compact}, hasOnClick=${!!onClick}`);

  if (!tag || !tag.tag) {
    log('GameTag: no tag, returning null');
    return null;
  }

  const style = TAG_STYLES[tag.tag];

  if (!style) {
    log(`GameTag: no style for tag=${tag.tag}, returning null`);
    return null;
  }

  log(`GameTag: rendering badge for tag=${tag.tag}`);

  // Compact mode: just the icon with background circle
  if (compact) {
    const compactStyle: CSSProperties = {
      position: 'absolute',
      top: '8px',
      right: '8px',
      background: 'rgba(0, 0, 0, 0.7)',
      borderRadius: '50%',
      padding: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
      zIndex: 1000,
      cursor: onClick ? 'pointer' : 'default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      userSelect: 'none',
    };

    return (
      <div onClick={onClick} style={compactStyle} title={style.label}>
        <TagIcon type={tag.tag as any} size={16} />
      </div>
    );
  }

  // Full mode: badge with icon and text
  // Note: position is relative (not absolute) - parent handles placement
  const containerStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    background: style.background,
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    cursor: onClick ? 'pointer' : 'default',
    alignItems: 'center',
    gap: '8px',
    userSelect: 'none',
    transition: 'transform 0.2s ease',
  };

  return (
    <div
      onClick={onClick}
      style={containerStyle}
      title={tag.is_manual ? 'Manual tag - Click to edit' : 'Automatic tag - Click to edit'}
    >
      <TagIcon type={tag.tag as any} size={18} />
      <span>{style.label}</span>
      {tag.is_manual && (
        <span style={{ fontSize: '12px', opacity: 0.8 }}>✎</span>
      )}
    </div>
  );
};
