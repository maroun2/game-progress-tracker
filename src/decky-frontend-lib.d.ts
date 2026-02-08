/**
 * Type declarations for decky-frontend-lib
 */

// Global constant injected by rollup at build time
declare const __PLUGIN_VERSION__: string;

declare module 'decky-frontend-lib' {
  import { ReactElement, FC, VFC } from 'react';

  export interface ServerAPI {
    callPluginMethod<T = any>(method: string, args: Record<string, any>): Promise<{ result: T }>;
    routerHook: {
      addPatch(route: string, callback: (props: any) => any): any;
      removePatch(patch: any): void;
    };
  }

  export interface PluginDefinition {
    title: ReactElement;
    content: ReactElement;
    icon: ReactElement;
    onDismount?: () => void;
  }

  export function definePlugin(fn: (serverAPI: ServerAPI) => PluginDefinition): any;

  export const staticClasses: {
    Title: string;
    [key: string]: string;
  };

  // UI Components (simplified types)
  export const ConfirmModal: any;
  export const PanelSection: any;
  export const PanelSectionRow: any;
  export const ButtonItem: any;
  export const ToggleField: any;
  export const SliderField: any;
}