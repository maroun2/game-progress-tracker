/**
 * GameTagBadge Component
 * Wrapper component for displaying game tag on library app page
 * Designed to be injected via safe route patching
 * Uses same positioning pattern as ProtonDB Badges
 */

import React, { useState, useEffect, useRef, FC } from 'react';
import { appDetailsClasses, appDetailsHeaderClasses } from '@decky/ui';
import { GameTag } from './GameTag';
import { TagManager } from './TagManager';
import { useGameTag } from '../hooks/useGameTag';
import { syncSingleGameWithFrontendData } from '../lib/syncUtils';

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
 * Find the TopCapsule element by walking up the DOM tree
 * Same pattern used by ProtonDB Badges
 */
function findTopCapsuleParent(ref: HTMLDivElement | null): Element | null {
  const children = ref?.parentElement?.children;
  if (!children) {
    return null;
  }

  // Find the Header container
  let headerContainer: Element | undefined;
  for (const child of children) {
    if (child.className.includes(appDetailsClasses.Header)) {
      headerContainer = child;
      break;
    }
  }

  if (!headerContainer) {
    return null;
  }

  // Find TopCapsule within the header
  let topCapsule: Element | null = null;
  for (const child of headerContainer.children) {
    if (child.className.includes(appDetailsHeaderClasses.TopCapsule)) {
      topCapsule = child;
      break;
    }
  }

  return topCapsule;
}

/**
 * Placeholder button when no tag exists
 */
const AddTagButton: FC<{ onClick: () => void }> = ({ onClick }) => {
  const buttonStyle: React.CSSProperties = {
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
 * Positions on opposite side of ProtonDB (top-right vs their top-left default)
 */
export const GameTagBadge: FC<GameTagBadgeProps> = ({ appid }) => {
  const { tag, loading, error, refetch } = useGameTag(appid);
  const [showManager, setShowManager] = useState(false);
  const [show, setShow] = useState(true);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    log(`Mounted: appid=${appid}`);

    // Sync this game's data when detail page is viewed
    // This ensures we have the latest playtime and achievement data
    (async () => {
      try {
        log(`Syncing game data for appid=${appid}...`);
        const result = await syncSingleGameWithFrontendData(appid);
        if (result.success) {
          log(`Game ${appid} synced successfully, refreshing tag...`);
          refetch();
        } else {
          log(`Game ${appid} sync failed: ${result.error}`);
        }
      } catch (e) {
        log(`Error syncing game ${appid}:`, e);
      }
    })();

    return () => {
      log(`Unmounted: appid=${appid}`);
    };
  }, [appid]);

  // Watch for fullscreen mode changes (same pattern as ProtonDB)
  useEffect(() => {
    const topCapsule = findTopCapsuleParent(ref?.current);
    if (!topCapsule) {
      log('TopCapsule container not found');
      return;
    }

    log('TopCapsule found, setting up mutation observer');

    const mutationObserver = new MutationObserver((entries) => {
      for (const entry of entries) {
        if (entry.type !== 'attributes' || entry.attributeName !== 'class') {
          continue;
        }

        const className = (entry.target as Element).className;
        const fullscreenMode =
          className.includes(appDetailsHeaderClasses.FullscreenEnterStart) ||
          className.includes(appDetailsHeaderClasses.FullscreenEnterActive) ||
          className.includes(appDetailsHeaderClasses.FullscreenEnterDone) ||
          className.includes(appDetailsHeaderClasses.FullscreenExitStart) ||
          className.includes(appDetailsHeaderClasses.FullscreenExitActive);
        const fullscreenAborted =
          className.includes(appDetailsHeaderClasses.FullscreenExitDone);

        setShow(!fullscreenMode || fullscreenAborted);
      }
    });

    mutationObserver.observe(topCapsule, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mutationObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    log(`State update: appid=${appid}, loading=${loading}, tag=`, tag);
    if (error) {
      log(`Error: ${error}`);
    }
  }, [appid, tag, loading, error]);

  if (loading) {
    log(`Still loading for appid=${appid}`);
    return <div ref={ref} style={{ display: 'none' }} />;
  }

  log(`Rendering: appid=${appid}, hasTag=${!!tag}, tagValue=${tag?.tag || 'none'}, show=${show}`);

  const handleClick = () => {
    log(`Tag button clicked for appid=${appid}`);
    setShowManager(true);
  };

  const handleClose = () => {
    log(`TagManager closed for appid=${appid}`);
    setShowManager(false);
    refetch();
  };

  // Position on top-right (opposite side from ProtonDB's default top-left)
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50px',
    right: '20px',
    zIndex: 10,
  };

  return (
    <div ref={ref} style={containerStyle}>
      {show && (
        <>
          {tag && tag.tag ? (
            <GameTag tag={tag} onClick={handleClick} />
          ) : (
            <AddTagButton onClick={handleClick} />
          )}
          {showManager && (
            <TagManager
              appid={appid}
              onClose={handleClose}
            />
          )}
        </>
      )}
    </div>
  );
};
