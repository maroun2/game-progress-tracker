/**
 * Library Grid Patching
 * Adds tag icons to game covers in the library grid view
 * Uses React tree patching approach (like detail pages) instead of DOM manipulation
 */

import {
  afterPatch,
  findInReactTree,
  createReactTreePatcher
} from '@decky/ui';
import { routerHook } from '@decky/api';
import React, { ReactElement } from 'react';
import { LibraryTagIcon, preloadAllTags } from '../components/LibraryTagIcon';

// Debug logging helper
const log = (msg: string, data?: any) => {
  const logMsg = `[GameProgressTracker][patchLibraryGrid] ${msg}`;
  if (data !== undefined) {
    console.log(logMsg, data);
  } else {
    console.log(logMsg);
  }
};

// Cache to track which components we've already patched
const patchedComponents = new WeakSet();

/**
 * Extract app ID from various possible props locations
 */
function getAppIdFromProps(props: any): string | null {
  if (!props) return null;

  // Try direct appid prop
  if (props.appid) {
    return String(props.appid);
  }

  // Try data.appid (common pattern)
  if (props.data?.appid) {
    return String(props.data.appid);
  }

  // Try overview.appid
  if (props.overview?.appid) {
    return String(props.overview.appid);
  }

  // Try libraryAsset pattern
  if (props.libraryAsset?.appid) {
    return String(props.libraryAsset.appid);
  }

  // Try app.appid
  if (props.app?.appid) {
    return String(props.app.appid);
  }

  // Try children props
  if (props.children?.props?.appid) {
    return String(props.children.props.appid);
  }

  // Steam Deck specific patterns
  if (props.appId) {
    return String(props.appId);
  }

  if (props.data?.appId) {
    return String(props.data.appId);
  }

  // Check for game ID in various formats
  if (props.gameId) {
    return String(props.gameId);
  }

  if (props.game?.id) {
    return String(props.game.id);
  }

  return null;
}


/**
 * Find and patch game tiles in the React tree
 */
function findAndPatchGameTiles(tree: any): any {
  if (!tree) return tree;

  try {
    // Check if current node is a game tile
    if (tree?.props) {
      const appId = getAppIdFromProps(tree.props);

      if (appId && !patchedComponents.has(tree)) {
        log(`Found potential game tile with appId ${appId}`);

        // Be more aggressive - patch anything with an appId
        // Don't require image confirmation since React components might not have rendered yet
        patchedComponents.add(tree);

        // Track patch count
        if (!(window as any).__gameProgressTrackerPatchCount) {
          (window as any).__gameProgressTrackerPatchCount = 0;
        }
        (window as any).__gameProgressTrackerPatchCount++;

        log(`Patching game tile for app ${appId} (patch #${(window as any).__gameProgressTrackerPatchCount})`);

        // Wrap the component with our icon
        return (
          <div key={`gpt-${appId}`} style={{ position: 'relative', display: 'contents' }}>
            {tree}
            <LibraryTagIcon appId={appId} />
          </div>
        );
      }
    }

    // Recursively process children
    if (tree?.props?.children) {
      if (Array.isArray(tree.props.children)) {
        tree.props.children = tree.props.children.map(findAndPatchGameTiles);
      } else {
        tree.props.children = findAndPatchGameTiles(tree.props.children);
      }
    }

    return tree;
  } catch (err) {
    log('Error in findAndPatchGameTiles:', err);
    return tree;
  }
}

/**
 * Patch library routes to add tag icons using React tree patching
 */
function patchLibraryGrid() {
  log('Setting up library grid patch with React tree patching');

  // Preload tags once at startup
  preloadAllTags().then(() => {
    log('Tags preloaded for library grid');
  }).catch(err => {
    log('Error preloading tags:', err);
  });

  // Patch multiple library routes
  // Note: Steam Deck uses /routes/library with tab variations
  const libraryRoutes = [
    '/routes/library',
    '/routes/library/tab/:tab',  // This is what we're seeing: /routes/library/tab/GreatOnDeck
    '/routes/library/home',
    '/routes/library/collection/:collection',
    '/library/home',
    '/library/collection/:collection',
    '/library',
  ];

  const unpatchers: Array<any> = [];  // RoutePatch type

  libraryRoutes.forEach(route => {
    log(`Registering patch for route: ${route}`);

    const unpatch = routerHook.addPatch(
      route,
      (routeProps: any) => {
        log(`🎯 Route patch TRIGGERED for ${route}`);

        try {
          // Find the route props with renderFunc
          const renderFuncContainer = findInReactTree(routeProps, (x: any) => x?.renderFunc);

          if (renderFuncContainer) {
            log(`✅ Found renderFunc for ${route}`);

            // Create a patcher that will modify the React tree
            const patchHandler = createReactTreePatcher(
              [
                // Try multiple strategies to find the game components
                (tree: any) => {
                  log(`Searching React tree for library components in ${route}`);

                  // Strategy 1: Look for grid containers
                  let found = findInReactTree(
                    tree,
                    (x: any) => {
                      if (x?.props?.className) {
                        const className = String(x.props.className).toLowerCase();
                        return className.includes('grid') ||
                               className.includes('library') ||
                               className.includes('collection') ||
                               className.includes('gamelist') ||
                               className.includes('appportrait');
                      }
                      return false;
                    }
                  );

                  if (found) {
                    log('Found container via className strategy');
                    return found;
                  }

                  // Strategy 2: Look for arrays of game components
                  found = findInReactTree(
                    tree,
                    (x: any) => {
                      if (Array.isArray(x?.props?.children) && x.props.children.length > 0) {
                        const hasGameTiles = x.props.children.some((child: any) => {
                          const appId = getAppIdFromProps(child?.props);
                          if (appId) {
                            log(`Found game tile array with app ${appId}`);
                            return true;
                          }
                          return false;
                        });
                        return hasGameTiles;
                      }
                      return false;
                    }
                  );

                  if (found) {
                    log('Found container via game tile array strategy');
                    return found;
                  }

                  // Strategy 3: Just return the tree and try to patch everything
                  log('No specific container found, will patch entire tree');
                  return tree;
                }
              ],
              (_: Array<Record<string, unknown>>, ret?: ReactElement) => {
                if (!ret) return ret;

                log(`Patching React tree for ${route}`);

                // Process the entire tree to find and patch game tiles
                const patchedTree = findAndPatchGameTiles(ret);

                // Count how many patches we applied
                const patchCount = (window as any).__gameProgressTrackerPatchCount || 0;
                log(`Total patches applied so far: ${patchCount}`);

                return patchedTree;
              }
            );

            afterPatch(renderFuncContainer, "renderFunc", patchHandler);
            log(`✅ Patch handler attached to renderFunc for ${route}`);
          } else {
            log(`⚠️ No renderFunc found for ${route}, checking route structure...`);

            // Log what we do have in routeProps
            const propKeys = Object.keys(routeProps || {});
            log(`Route props available: ${propKeys.join(', ')}`);

            // Try different patching strategies based on what's available
            if (routeProps?.component) {
              log(`Found 'component' property, attempting component patching`);

              const originalComponent = routeProps.component;
              routeProps.component = function(...args: any[]) {
                log(`Component render triggered for ${route}`);
                const result = originalComponent?.apply(this, args);

                // Try to patch the result
                if (result) {
                  return findAndPatchGameTiles(result);
                }
                return result;
              };
            } else if (routeProps?.render) {
              log(`Found 'render' property, attempting render patching`);

              const originalRender = routeProps.render;
              routeProps.render = function(...args: any[]) {
                log(`Render triggered for ${route}`);
                const result = originalRender?.apply(this, args);

                // Try to patch the result
                if (result) {
                  return findAndPatchGameTiles(result);
                }
                return result;
              };
            } else if (routeProps?.componentDidMount) {
              log(`Found 'componentDidMount', attempting lifecycle patching`);

              const originalDidMount = routeProps.componentDidMount;
              routeProps.componentDidMount = function(...args: any[]) {
                log(`ComponentDidMount triggered for ${route}`);
                return originalDidMount?.apply(this, args);
              };
            } else {
              log(`⚠️ No suitable patching point found for ${route}`);
            }
          }
        } catch (error) {
          log(`Error patching route ${route}:`, error);
        }

        return routeProps;
      }
    );

    unpatchers.push(unpatch);
  });

  log(`Registered ${unpatchers.length} route patches`);

  // Return cleanup function
  return () => {
    log('Removing library grid patches');
    unpatchers.forEach(unpatch => unpatch());
    // WeakSet doesn't have clear() method - just create a new one if needed
    // The old one will be garbage collected when no longer referenced
  };
}

export default patchLibraryGrid;