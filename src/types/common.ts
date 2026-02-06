// Common types used across all platforms

export interface UserHandles {
    codeforces?: string;
    leetcode?: string;
    codechef?: string;
    gfg?: string;
}

export interface FetchOptions {
    timeout?: number; // milliseconds, default: 10000
}

export type PlatformResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };
