// GeeksforGeeks platform fetcher (HTML scraping)

import * as cheerio from 'cheerio';
import { fetchHTML } from '../utils/fetcher.js';
import { UserNotFoundError, PlatformError } from '../utils/errors.js';
import type { GfGStats, PlatformResult, FetchOptions } from '../types/index.js';

const PLATFORM = 'GeeksforGeeks';
const BASE_URL = 'https://www.geeksforgeeks.org';

export async function getGfG(
    username: string,
    options: FetchOptions = {}
): Promise<PlatformResult<GfGStats>> {
    const timeout = options.timeout ?? 10000;

    try {
        const url = `${BASE_URL}/profile/${username}`;
        const html = await fetchHTML(url, timeout);

        // Check for userData presence
        if (!html.match(/\\?"userData\\?":/)) {
            if (html.includes('404') || html.includes('User not found')) {
                throw new UserNotFoundError(PLATFORM, username);
            }
            // fallback: if no userData but page loaded, maybe structure changed?
            // for now throw error to be safe
            throw new PlatformError(PLATFORM, 'Failed to find user data in profile page');
        }

        // Regex for fields (handling escaped quotes)
        const scoreMatch = html.match(/\\?"score\\?":\s*(\d+)/);
        const totalSolvedMatch = html.match(/\\?"total_problems_solved\\?":\s*(\d+)/);
        const instituteRankMatch = html.match(/\\?"institute_rank\\?":\s*(\d+)/);
        const avatarMatch = html.match(/\\?"profile_image_url\\?":\s*\\?"([^"\\]+)\\?"/);
        const maxStreakMatch = html.match(/\\?"pod_solved_global_longest_streak\\?":\s*(\d+)/);
        const currentStreakMatch = html.match(/\\?"pod_solved_current_streak\\?":\s*(\d+)/);

        const codingScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
        const totalSolved = totalSolvedMatch ? parseInt(totalSolvedMatch[1]) : 0;
        const instituteRank = instituteRankMatch ? parseInt(instituteRankMatch[1]) : undefined;
        // unescape avatar url if needed (usually just removal of backslashes)
        let avatarUrl = avatarMatch ? avatarMatch[1].replace(/\\/g, '') : '';
        const avatar = avatarUrl || `${BASE_URL}/img/default-profile.png`;
        const maxStreak = maxStreakMatch ? parseInt(maxStreakMatch[1]) : 0;
        const currentStreak = currentStreakMatch ? parseInt(currentStreakMatch[1]) : 0;

        const stats: GfGStats = {
            username,
            codingScore,
            solved: {
                total: totalSolved,
                easy: 0, // Not available in SSR HTML
                medium: 0, // Not available in SSR HTML
                hard: 0, // Not available in SSR HTML
            },
            currentStreak,
            maxStreak,
            instituteRank,
            avatar,
        };

        return { success: true, data: stats };
    } catch (error) {
        if (error instanceof UserNotFoundError) {
            return { success: false, error: error.message };
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: new PlatformError(PLATFORM, message).message };
    }
}

export async function getGfGRaw(
    username: string,
    options: FetchOptions = {}
): Promise<PlatformResult<string>> {
    const timeout = options.timeout ?? 10000;

    try {
        const url = `${BASE_URL}/profile/${username}`;
        const html = await fetchHTML(url, timeout);

        if (html.includes('404') || html.includes('User not found')) {
            throw new UserNotFoundError(PLATFORM, username);
        }

        return { success: true, data: html };
    } catch (error) {
        if (error instanceof UserNotFoundError) {
            return { success: false, error: error.message };
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: new PlatformError(PLATFORM, message).message };
    }
}
