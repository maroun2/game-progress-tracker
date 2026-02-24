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
import patchLibraryGrid from './lib/patchLibraryGrid';
import { syncLibraryProgressive } from './lib/syncUtils';
import { startAchievementCacheWatcher, stopAchievementCacheWatcher } from './lib/achievementCacheWatcher';

// Debug logging helper
const log = (msg: string, data?: any) => {
  const logMsg = `[DeckProgressTracker] ${msg}`;
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
  let libraryGridPatch: ReturnType<typeof patchLibraryGrid> | null = null;

  try {
    libraryPatch = patchLibraryApp();
    log('Library app patch registered successfully');
  } catch (error) {
    log('Failed to register library app patch:', error);
  }

  // Patch the library grid view to add tag icons
  log('Setting up library grid patch');
  try {
    libraryGridPatch = patchLibraryGrid();
    log('Library grid patch registered successfully');
  } catch (error) {
    log('Failed to register library grid patch:', error);
  }

  // Start achievement cache watcher (monitors when user views "Your Stuff" tab)
  log('Starting achievement cache watcher');
  startAchievementCacheWatcher();

  // Debug: Check Steam frontend API availability
  log('Checking Steam frontend API availability on plugin load...');
  log(`window.appStore exists: ${!!(window as any).appStore}`);
  log(`window.collectionStore exists: ${!!(window as any).collectionStore}`);
  log(`window.appAchievementProgressCache exists: ${!!(window as any).appAchievementProgressCache}`);
  log(`window.SteamClient exists: ${!!(window as any).SteamClient}`);

  // If appStore exists, check its properties
  if ((window as any).appStore) {
    const appStore = (window as any).appStore;
    log('appStore properties:', Object.keys(appStore).slice(0, 20).join(', '));
    log(`GetAppOverviewByAppID exists: ${typeof appStore.GetAppOverviewByAppID}`);

    // Try to get a known game to test if it's actually working
    try {
      const testOverview = appStore.GetAppOverviewByAppID(730); // CS:GO as test
      log(`Test GetAppOverviewByAppID(730) result: ${testOverview ? 'SUCCESS' : 'NULL'}`);
      if (testOverview) {
        log(`Test game name: ${testOverview.display_name}`);
      }
    } catch (e) {
      log(`Test GetAppOverviewByAppID failed: ${e}`);
    }
  }

  // Trigger sync with frontend data (replaces backend auto-sync)
  // This uses Steam's frontend API for real-time playtime and achievement data
  log('Scheduling initial sync with frontend data...');

  // Add a delay before attempting sync to let Steam frontend initialize
  const syncDelay = 5000; // Start with 5 seconds delay
  log(`Waiting ${syncDelay}ms before initial sync attempt...`);

  setTimeout(async () => {
    log('Starting delayed initial sync...');
    log(`window.appStore NOW exists: ${!!(window as any).appStore}`);
    log(`window.collectionStore NOW exists: ${!!(window as any).collectionStore}`);

    try {
      log('Calling syncLibraryProgressive...');
      // Use progressive sync with progress logging
      const result = await syncLibraryProgressive((current, total, gameName) => {
        // Log progress every 50 games to avoid log spam
        if (current % 50 === 0 || current === total) {
          log(`Initial sync progress: ${current}/${total}${gameName ? ` - ${gameName}` : ''}`);
        }
      });
      log('Initial sync returned:', result);
      log(`Result details: success=${result?.success}, total=${result?.total}, synced=${result?.synced}, error=${result?.error}`);

      // Show toast notification when initial sync completes
      // Use new_tags count from backend for accurate notification
      if (result && result.success && result.synced && result.synced > 0) {
        const newTags = result.new_tags || 0;
        const message = newTags > 0
          ? `Synced ${result.synced} games. ${newTags} new tag${newTags > 1 ? 's' : ''} added!`
          : `Synced ${result.synced} games. Open plugin to see your library.`;

        log(`Showing success toast: ${message}`);
        toaster.toast({
          title: 'Deck Progress Tracker',
          body: message,
          duration: 5000,
        });
      } else if (!result || !result.success) {
        log(`Sync failed or incomplete: success=${result?.success}, error=${result?.error}`);
        log('Will retry in 10 seconds...');

        // Show error toast
        toaster.toast({
          title: 'Deck Progress Tracker',
          body: `Initial sync failed: ${result?.error || 'Unknown error'}. Will retry...`,
          duration: 5000,
        });

        // Retry once more after additional delay
        setTimeout(async () => {
          log('=== Starting sync retry (second attempt) ===');
          log(`window.appStore exists (retry): ${!!(window as any).appStore}`);
          try {
            const retryResult = await syncLibraryProgressive((current, total, gameName) => {
              // Log progress for retry
              if (current % 50 === 0 || current === total) {
                log(`Retry sync progress: ${current}/${total}${gameName ? ` - ${gameName}` : ''}`);
              }
            });
            log('Retry sync result:', retryResult);
            log(`Retry details: success=${retryResult?.success}, synced=${retryResult?.synced}`);

            if (retryResult && retryResult.success && retryResult.synced) {
              toaster.toast({
                title: 'Deck Progress Tracker',
                body: `Library synced: ${retryResult.synced} games processed`,
                duration: 5000,
              });
            } else {
              log('Retry also failed/incomplete');
              toaster.toast({
                title: 'Deck Progress Tracker',
                body: 'Auto-sync failed. Please sync manually from settings.',
                duration: 8000,
              });
            }
          } catch (retryErr: any) {
            log('Retry sync threw error:', retryErr);
            log('Error message:', retryErr?.message);
            log('Error stack:', retryErr?.stack);
          }
        }, 10000);
      }
    } catch (err: any) {
      log('Initial sync threw error:', err);
      log('Error message:', err?.message);
      log('Error stack:', err?.stack);

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
      log('=== Plugin dismounting ===');

      // Stop achievement cache watcher
      stopAchievementCacheWatcher();

      // Clean up patches when plugin is unloaded
      if (libraryPatch) {
        try {
          routerHook.removePatch('/library/app/:appid', libraryPatch);
          log('Library app patch removed successfully');
        } catch (error) {
          log('Error removing library app patch:', error);
        }
      }

      // Clean up library grid patch
      if (libraryGridPatch) {
        try {
          libraryGridPatch(); // This calls the cleanup function
          log('Library grid patch removed successfully');
        } catch (error) {
          log('Error removing library grid patch:', error);
        }
      }
    }
  };
});
