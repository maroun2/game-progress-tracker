/**
 * Game Progress Tracker - Main Plugin Entry
 * Decky Loader plugin for automatic game tagging
 *
 * Uses safe route patching pattern based on ProtonDB Badges plugin
 */

import { staticClasses } from '@decky/ui';
import { definePlugin, routerHook } from '@decky/api';
import React from 'react';
import { Settings } from './components/Settings';
import patchLibraryApp from './lib/patchLibraryApp';

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
 * Main Plugin Definition
 */
export default definePlugin(() => {
  log('=== Plugin initializing ===');

  // Patch the game library page using the safe ProtonDB-style approach
  log('Setting up library app patch');
  let libraryPatch: ReturnType<typeof patchLibraryApp> | null = null;

  try {
    libraryPatch = patchLibraryApp();
    log('Library app patch registered successfully');
  } catch (error) {
    log('Failed to register library app patch:', error);
  }

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
      log('=== Plugin dismounting ===');
      // Clean up patches when plugin is unloaded
      if (libraryPatch) {
        try {
          routerHook.removePatch('/library/app/:appid', libraryPatch);
          log('Library app patch removed successfully');
        } catch (error) {
          log('Error removing library app patch:', error);
        }
      }
    }
  };
});
