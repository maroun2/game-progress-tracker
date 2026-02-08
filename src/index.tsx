/**
 * Game Progress Tracker - Main Plugin Entry
 * Decky Loader plugin for automatic game tagging
 */

import { staticClasses } from '@decky/ui';
import { definePlugin, routerHook } from '@decky/api';
import React, { ReactElement, useState, FC } from 'react';
import { GameTag } from './components/GameTag';
import { TagManager } from './components/TagManager';
import { Settings } from './components/Settings';
import { useGameTag } from './hooks/useGameTag';

/**
 * Extract appid from route path
 */
function extractAppId(path: string): string | null {
  const match = path.match(/\/library\/app\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Game Page Overlay Component
 * Displays tag badge and manages tag editor
 */
const GamePageOverlay: FC<{ appid: string }> = ({ appid }) => {
  const { tag, loading } = useGameTag(appid);
  const [showManager, setShowManager] = useState(false);

  if (loading || !tag) {
    return null;
  }

  return (
    <>
      <GameTag tag={tag} onClick={() => setShowManager(true)} />
      {showManager && (
        <TagManager
          appid={appid}
          onClose={() => setShowManager(false)}
        />
      )}
    </>
  );
};

/**
 * Main Plugin Definition
 */
export default definePlugin(() => {
  // Patch the game library page to inject our tag component
  const gamePagePatch = routerHook.addPatch(
    '/library/app/:appId',
    (props: { path: string; children: ReactElement }) => {
      const appid = extractAppId(props.path);

      if (appid) {
        return (
          <>
            {props.children}
            <GamePageOverlay appid={appid} />
          </>
        );
      }

      return props.children;
    }
  );

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
