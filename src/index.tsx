/**
 * Game Progress Tracker - Main Plugin Entry
 * Decky Loader plugin for automatic game tagging
 */

import { staticClasses } from '@decky/ui';
import { definePlugin, routerHook } from '@decky/api';
import React, { ReactElement, useState, useEffect, FC } from 'react';
import { GameTag } from './components/GameTag';
import { TagManager } from './components/TagManager';
import { Settings } from './components/Settings';
import { useGameTag } from './hooks/useGameTag';

// Debug logging helper
const log = (msg: string, data?: any) => {
  const logMsg = `[GameProgressTracker] ${msg}`;
  if (data !== undefined) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
};

/**
 * Extract appid from route path
 */
function extractAppId(path: string): string | null {
  const match = path.match(/\/library\/app\/(\d+)/);
  log(`extractAppId: path="${path}", match=${match ? match[1] : 'null'}`);
  return match ? match[1] : null;
}

/**
 * Placeholder button when no tag exists
 */
const AddTagButton: FC<{ onClick: () => void }> = ({ onClick }) => {
  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(50, 50, 50, 0.9)',
    color: '#aaa',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    zIndex: 1000,
    cursor: 'pointer',
    display: 'flex',
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

/**
 * Game Page Overlay Component
 * Displays tag badge and manages tag editor
 */
const GamePageOverlay: FC<{ appid: string }> = ({ appid }) => {
  const { tag, loading, error, refetch } = useGameTag(appid);
  const [showManager, setShowManager] = useState(false);

  useEffect(() => {
    log(`GamePageOverlay: appid=${appid}, loading=${loading}, tag=`, tag);
    if (error) {
      log(`GamePageOverlay: error=${error}`);
    }
  }, [appid, tag, loading, error]);

  // Show overlay even if no tag (allows clicking to open TagManager)
  if (loading) {
    log(`GamePageOverlay: still loading for appid=${appid}`);
    return null;
  }

  log(`GamePageOverlay: rendering for appid=${appid}, hasTag=${!!tag}, tagValue=${tag?.tag || 'none'}`);

  const handleClick = () => {
    log(`Tag button clicked for appid=${appid}`);
    setShowManager(true);
  };

  const handleClose = () => {
    log(`TagManager closed for appid=${appid}`);
    setShowManager(false);
    // Refresh tag after closing manager (in case it was changed)
    refetch();
  };

  return (
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
  );
};

/**
 * Main Plugin Definition
 */
export default definePlugin(() => {
  log('=== Plugin initializing ===');

  // Patch the game library page to inject our tag component
  log('Adding route patch for /library/app/:appId');
  const gamePagePatch = routerHook.addPatch(
    '/library/app/:appId',
    (props: { path: string; children: ReactElement }) => {
      log(`Route patch called with path: ${props.path}`);
      const appid = extractAppId(props.path);

      if (appid) {
        log(`Route patch: injecting GamePageOverlay for appid=${appid}`);
        return (
          <>
            {props.children}
            <GamePageOverlay appid={appid} />
          </>
        );
      }

      log(`Route patch: no appid extracted, returning children only`);
      return props.children;
    }
  );
  log('Route patch added');

  return {
    name: 'Game Progress Tracker',
    titleView: <div className={staticClasses.Title}>Game Progress Tracker</div>,
    content: <Settings />,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        width="24"
        height="24"
      >
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.87 0-7-3.13-7-7V8.3l7-3.11 7 3.11V13c0 3.87-3.13 7-7 7zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" />
      </svg>
    ),
    onDismount() {
      // Clean up patches when plugin is unloaded
      routerHook.removePatch('/library/app/:appId', gamePagePatch);
    }
  };
});
