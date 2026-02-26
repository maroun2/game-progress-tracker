/**
 * Deck Progress Tracker - Main Plugin Entry
 * Decky Loader plugin for automatic game tagging
 *
 * Uses safe route patching pattern based on ProtonDB Badges plugin
 */

import { staticClasses } from '@decky/ui';
import { definePlugin, routerHook, toaster } from '@decky/api';
import React from 'react';
import { FaTrophy } from 'react-icons/fa';
import { Settings } from './components/Settings';
import patchLibraryApp from './lib/patchLibraryApp';
import { syncLibraryProgressive } from './lib/syncUtils';
import { startAchievementCacheWatcher, stopAchievementCacheWatcher } from './lib/achievementCacheWatcher';

/**
 * Main Plugin Definition
 */
export default definePlugin(() => {
  // Patch the game library page using the safe ProtonDB-style approach
  let libraryPatch: ReturnType<typeof patchLibraryApp> | null = null;

  try {
    libraryPatch = patchLibraryApp();
  } catch (error) {
    // Failed to register library app patch
  }

  // Start achievement cache watcher (monitors when user views "Your Stuff" tab)
  startAchievementCacheWatcher();

  // Trigger sync with frontend data (replaces backend auto-sync)
  // This uses Steam's frontend API for real-time playtime and achievement data

  // Add a delay before attempting sync to let Steam frontend initialize
  const syncDelay = 5000; // Start with 5 seconds delay

  setTimeout(async () => {
    try {
      // Use progressive sync with progress logging
      const result = await syncLibraryProgressive((current, total, gameName) => {
        // Progress callback - could be used for UI updates in future
      });

      // Show toast notification when initial sync completes
      // Use new_tags count from backend for accurate notification
      if (result && result.success && result.synced && result.synced > 0) {
        const newTags = result.new_tags || 0;
        const message = newTags > 0
          ? `Synced ${result.synced} games. ${newTags} new tag${newTags > 1 ? 's' : ''} added!`
          : `Synced ${result.synced} games. Open plugin to see your library.`;

        toaster.toast({
          title: 'Deck Progress Tracker',
          body: message,
          duration: 5000,
        });
      } else if (!result || !result.success) {

        // Show error toast
        toaster.toast({
          title: 'Deck Progress Tracker',
          body: `Initial sync failed: ${result?.error || 'Unknown error'}. Will retry...`,
          duration: 5000,
        });

        // Retry once more after additional delay
        setTimeout(async () => {
          try {
            const retryResult = await syncLibraryProgressive((current, total, gameName) => {
              // Progress callback for retry
            });

            if (retryResult && retryResult.success && retryResult.synced) {
              toaster.toast({
                title: 'Deck Progress Tracker',
                body: `Library synced: ${retryResult.synced} games processed`,
                duration: 5000,
              });
            } else {
              toaster.toast({
                title: 'Deck Progress Tracker',
                body: 'Auto-sync failed. Please sync manually from settings.',
                duration: 8000,
              });
            }
          } catch (retryErr: any) {
            // Retry sync failed
          }
        }, 10000);
      }
    } catch (err: any) {
      // Show error toast
      toaster.toast({
        title: 'Deck Progress Tracker',
        body: `Sync error: ${err?.message || 'Unknown error'}`,
        duration: 5000,
      });
    }
  }, syncDelay);

  return {
    name: 'Deck Progress Tracker',
    titleView: <div className={staticClasses.Title}>Deck Progress Tracker</div>,
    content: <Settings />,
    icon: <FaTrophy />,
    onDismount() {
      // Stop achievement cache watcher
      stopAchievementCacheWatcher();

      // Clean up patches when plugin is unloaded
      if (libraryPatch) {
        try {
          routerHook.removePatch('/library/app/:appid', libraryPatch);
        } catch (error) {
          // Error removing library app patch
        }
      }
    }
  };
});
