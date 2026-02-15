/**
 * TypeScript type definitions for Game Progress Tracker
 */
export interface GameTag {
    appid: string;
    tag: 'completed' | 'in_progress' | 'mastered' | 'dropped' | null;
    is_manual: boolean;
    last_updated: string;
}
export interface GameStats {
    appid: string;
    game_name: string;
    playtime_minutes: number;
    total_achievements: number;
    unlocked_achievements: number;
    achievement_percentage?: number;
    last_sync?: string;
}
export interface HLTBData {
    game_name: string;
    matched_name: string;
    similarity: number;
    main_story?: number;
    main_extra?: number;
    completionist?: number;
    all_styles?: number;
    hltb_url: string;
}
export interface GameDetails {
    success: boolean;
    appid: string;
    stats: GameStats | null;
    tag: GameTag | null;
    hltb_data: HLTBData | null;
    error?: string;
}
export interface PluginSettings {
    auto_tag_enabled: boolean;
    mastered_multiplier: number;
    in_progress_threshold: number;
    cache_ttl: number;
    source_installed: boolean;
    source_non_steam: boolean;
    source_all_owned: boolean;
}
export interface TagStatistics {
    completed: number;
    in_progress: number;
    mastered: number;
    backlog: number;
    dropped: number;
    total: number;
}
export interface TaggedGame {
    appid: string;
    game_name: string;
    tag: 'completed' | 'in_progress' | 'mastered' | 'dropped';
    is_manual: boolean;
}
export interface SyncResult {
    success: boolean;
    total?: number;
    synced?: number;
    new_tags?: number;
    errors?: number;
    error_details?: Array<{
        appid: string;
        error: string;
    }>;
    message?: string;
    error?: string;
}
export interface GameListResult {
    success: boolean;
    games: Array<{
        appid: string;
        name: string;
    }>;
    error?: string;
}
