/**
 * Library App Route Patching
 * Based on ProtonDB Badges plugin implementation
 * Uses proper Decky UI patching utilities for safety
 */

import {
  afterPatch,
  findInReactTree,
  appDetailsClasses,
  appDetailsHeaderClasses,
  createReactTreePatcher
} from '@decky/ui';
import { routerHook } from '@decky/api';
import React, { ReactElement } from 'react';
import { GameTagBadge } from '../components/GameTagBadge';

/**
 * Extract appid from the current route/URL
 */
function getAppIdFromUrl(): string | null {
  try {
    // Try to get appid from window location
    const match = window.location.pathname.match(/\/library\/app\/(\d+)/);
    if (match) {
      return match[1];
    }

    // Fallback: try to find it in the URL hash or other places
    const hashMatch = window.location.hash.match(/\/library\/app\/(\d+)/);
    if (hashMatch) {
      return hashMatch[1];
    }

    return null;
  } catch (e) {
    // Error occurred
    return null;
  }
}

/**
 * Patch the library app page to inject our tag badge
 * Following the ProtonDB Badges pattern for safety
 */
function patchLibraryApp() {
  return routerHook.addPatch(
    '/library/app/:appid',
    (tree: any) => {
      try {
        // Find the route props with renderFunc (same pattern as ProtonDB)
        const routeProps = findInReactTree(tree, (x: any) => x?.renderFunc);

        if (routeProps) {
          const patchHandler = createReactTreePatcher(
            [
              (tree: any) => findInReactTree(
                tree,
                (x: any) => x?.props?.children?.props?.overview
              )?.props?.children
            ],
            (_: Array<Record<string, unknown>>, ret?: ReactElement) => {
              // Find the inner container where we'll inject our badge
              const container = findInReactTree(
                ret,
                (x: ReactElement) =>
                  Array.isArray(x?.props?.children) &&
                  x?.props?.className?.includes(appDetailsClasses.InnerContainer)
              );

              if (typeof container !== 'object') {
                return ret;
              }

              // Get appid from URL since we're inside the render
              const appid = getAppIdFromUrl();

              if (appid) {
                // Inject our badge component at position 0 (first child, will use absolute positioning)
                container.props.children.splice(
                  0,
                  0,
                  <GameTagBadge key="game-progress-tag" appid={appid} />
                );
              }

              return ret;
            }
          );

          afterPatch(routeProps, "renderFunc", patchHandler);
        }
      } catch (error) {
        // Error occurred
      }

      return tree;
    }
  );
}

export default patchLibraryApp;
