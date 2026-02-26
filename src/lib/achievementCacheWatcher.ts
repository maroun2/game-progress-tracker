/**
 * Achievement Cache Watcher
 * Monitors URL changes and syncs achievements when user views "Your Stuff" tab
 */

import { syncSingleGameWithFrontendData } from './syncUtils';

let lastUrl = '';
let syncTimeout: NodeJS.Timeout | null = null;

/**
 * Start watching for URL changes to detect when user views achievements
 */
export function startAchievementCacheWatcher() {
  // Poll for URL changes every 500ms
  setInterval(() => {
    const currentUrl = window.location.href;

    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      // Check if user opened "Your Stuff" tab (where achievements are shown)
      const yourStuffMatch = currentUrl.match(/\/library\/app\/(\d+)\/tab\/YourStuff/);

      if (yourStuffMatch) {
        const appid = yourStuffMatch[1];

        // Clear any pending sync
        if (syncTimeout) {
          clearTimeout(syncTimeout);
        }

        // Wait for Steam to populate the achievement cache
        // Poll the cache with exponential backoff up to 10 seconds
        syncTimeout = setTimeout(async () => {
          const achievementCache = (window as any).appAchievementProgressCache;
          const mapCache = achievementCache?.m_achievementProgress?.mapCache;

          if (!mapCache) {
            return;
          }

          // Poll with exponential backoff: 500ms, 1s, 2s, 3s, 3s (total ~10s max)
          const delays = [500, 1000, 2000, 3000, 3000];
          let foundData = false;

          for (let i = 0; i < delays.length; i++) {
            await new Promise(resolve => setTimeout(resolve, delays[i]));

            const entry = mapCache.get(parseInt(appid));

            if (entry && entry.total > 0) {
              foundData = true;
              break;
            }
          }

          if (foundData) {
            try {
              await syncSingleGameWithFrontendData(appid);
            } catch (e: any) {
              // Error occurred
            }
          }
        }, 100); // Start polling after 100ms initial delay
      }
    }
  }, 500);
}

/**
 * Stop watching for URL changes
 */
export function stopAchievementCacheWatcher() {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
}
