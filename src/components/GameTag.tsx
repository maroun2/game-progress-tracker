/**
 * GameTag Component
 * Displays a colored badge for game tags
 */

import React, { VFC, CSSProperties } from 'react';
import { GameTag as GameTagType } from '../types';

interface GameTagProps {
  tag: GameTagType | null;
  onClick?: () => void;
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

export const GameTag: VFC<GameTagProps> = ({ tag, onClick }) => {
  if (!tag || !tag.tag) {
    return null;
  }

  const style = TAG_STYLES[tag.tag];

  if (!style) {
    return null;
  }

  const containerStyle: CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: style.background,
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    zIndex: 1000,
    cursor: onClick ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    userSelect: 'none',
    transition: 'transform 0.2s ease',
    ...(onClick ? { transform: 'scale(1)' } : {})
  };

  return (
    <div
      onClick={onClick}
      style={containerStyle}
      title={tag.is_manual ? 'Manual tag - Click to edit' : 'Automatic tag - Click to edit'}
    >
      <span>{style.label}</span>
      {tag.is_manual && (
        <span style={{ fontSize: '12px', opacity: 0.8 }}>✎</span>
      )}
    </div>
  );
};
