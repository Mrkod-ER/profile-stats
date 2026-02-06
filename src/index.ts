// Main SDK exports

import { getCodeforces, getCodeforcesRaw } from './platforms/codeforces.js';
import { getLeetCode, getLeetCodeRaw } from './platforms/leetcode.js';
import { getCodeChef, getCodeChefRaw } from './platforms/codechef.js';
import { getGfG, getGfGRaw } from './platforms/gfg.js';

import type {
    UserHandles,
    FetchOptions,
    CodeforcesStats,
    LeetCodeStats,
    CodeChefStats,
    GfGStats,
    PlatformResult,
} from './types/index.js';

// Re-export types
export * from './types/index.js';

// Re-export individual platform functions
export { getCodeforces, getCodeforcesRaw } from './platforms/codeforces.js';
export { getLeetCode, getLeetCodeRaw } from './platforms/leetcode.js';
export { getCodeChef, getCodeChefRaw } from './platforms/codechef.js';
export { getGfG, getGfGRaw } from './platforms/gfg.js';

// Unified interface for all stats
export interface AllStats {
    codeforces?: PlatformResult<CodeforcesStats>;
    leetcode?: PlatformResult<LeetCodeStats>;
    codechef?: PlatformResult<CodeChefStats>;
    gfg?: PlatformResult<GfGStats>;
}

/**
 * Fetch stats from all specified platforms in parallel
 * @param handles - Object with platform usernames
 * @param options - Fetch options (timeout)
 * @returns Results from all platforms (successful and failed)
 */
export async function getAllStats(
    handles: UserHandles,
    options: FetchOptions = {}
): Promise<AllStats> {
    const promises: Promise<[string, PlatformResult<any>]>[] = [];

    if (handles.codeforces) {
        promises.push(
            getCodeforces(handles.codeforces, options).then((result) => [
                'codeforces',
                result,
            ] as [string, PlatformResult<CodeforcesStats>])
        );
    }

    if (handles.leetcode) {
        promises.push(
            getLeetCode(handles.leetcode, options).then((result) => [
                'leetcode',
                result,
            ] as [string, PlatformResult<LeetCodeStats>])
        );
    }

    if (handles.codechef) {
        promises.push(
            getCodeChef(handles.codechef, options).then((result) => [
                'codechef',
                result,
            ] as [string, PlatformResult<CodeChefStats>])
        );
    }

    if (handles.gfg) {
        promises.push(
            getGfG(handles.gfg, options).then((result) => [
                'gfg',
                result,
            ] as [string, PlatformResult<GfGStats>])
        );
    }

    const results = await Promise.all(promises);

    const stats: AllStats = {};
    results.forEach(([platform, result]) => {
        (stats as any)[platform] = result;
    });

    return stats;
}
