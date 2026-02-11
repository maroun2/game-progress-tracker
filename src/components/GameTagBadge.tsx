/**
 * GameTagBadge Component
 * Wrapper component for displaying game tag on library app page
 * Designed to be injected via safe route patching
 */

import React, { useState, useEffect, FC } from 'react';
import { GameTag } from './GameTag';
import { TagManager } from './TagManager';
import { useGameTag } from '../hooks/useGameTag';

// Debug logging helper
const log = (msg: string, data?: any) => {
  const logMsg = `[GameProgressTracker][GameTagBadge] ${msg}`;
  if (data !== undefined) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
};

/**
 * Placeholder button when no tag exists
 */
const AddTagButton: FC<{ onClick: () => void }> = ({ onClick }) => {
  const buttonStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    background: 'rgba(50, 50, 50, 0.9)',
    color: '#aaa',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '8px',
    userSelect: 'none',
    border: '1px dashed #666',
    marginTop: '10px',
  };

  return (
    <div onClick={onClick} style={buttonStyle} title="Click to add tag">
      <span style={{ fontSize: '16px' }}>+</span>
      <span>Add Tag</span>
    </div>
  );
};

interface GameTagBadgeProps {
  appid: string;
}

/**
 * GameTagBadge - Main component injected into library app page
 * Shows tag badge or "Add Tag" button, with TagManager modal
 */
export const GameTagBadge: FC<GameTagBadgeProps> = ({ appid }) => {
  const { tag, loading, error, refetch } = useGameTag(appid);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    log(`Mounted: appid=${appid}`);
    return () => {
      log(`Unmounted: appid=${appid}`);
    };
  }, [appid]);

  useEffect(() => {
    log(`State update: appid=${appid}, loading=${loading}, tag=`, tag);
    if (error) {
      log(`Error: ${error}`);
    }
  }, [appid, tag, loading, error]);

  if (loading) {
    log(`Still loading for appid=${appid}`);
    return null;
  }

  log(`Rendering: appid=${appid}, hasTag=${!!tag}, tagValue=${tag?.tag || 'none'}`);

  const handleClick = () => {
    log(`Tag button clicked for appid=${appid}`);
    setShowManager(true);
  };

  const handleClose = () => {
    log(`TagManager closed for appid=${appid}`);
    setShowManager(false);
    refetch();
  };

  // Container style - positions the badge in the header area
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '0 16px',
  };

  return (
    <div style={containerStyle}>
      {tag && tag.tag ? (
        <div style={{ position: 'relative', display: 'inline-flex', marginTop: '10px' }}>
          <GameTag tag={tag} onClick={handleClick} />
        </div>
      ) : (
        <AddTagButton onClick={handleClick} />
      )}
      {showManager && (
        <TagManager
          appid={appid}
          onClose={handleClose}
        />
      )}
    </div>
  );
};
