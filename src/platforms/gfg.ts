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
        const url = `${BASE_URL}/user/${username}/`;
        const html = await fetchHTML(url, timeout);
        const $ = cheerio.load(html);

        // Check if user exists
        if ($('h1:contains("404")').length > 0 || html.includes('User not found')) {
            throw new UserNotFoundError(PLATFORM, username);
        }

        // Extract coding score
        const scoreText = $('.score_card_value').first().text().trim();
        const codingScore = parseInt(scoreText) || 0;

        // Extract current streak
        const currentStreakText = $('.streak_count').first().text().trim();
        const currentStreak = parseInt(currentStreakText) || 0;

        // Extract max streak
        const maxStreakText = $('.max_streak').text().trim() || currentStreakText;
        const maxStreak = parseInt(maxStreakText) || currentStreak;

        // Extract solved problems by difficulty
        const problemStats = $('.problems_solved .problems_solved_section');
        let totalSolved = 0;
        let easy = 0;
        let medium = 0;
        let hard = 0;

        problemStats.each((_, elem) => {
            const label = $(elem).find('.difficulty_label').text().toLowerCase();
            const count = parseInt($(elem).find('.solved_count').text().trim()) || 0;

            if (label.includes('easy')) easy = count;
            else if (label.includes('medium')) medium = count;
            else if (label.includes('hard')) hard = count;

            totalSolved += count;
        });

        // Extract institute rank (if available)
        const instituteRankText = $('.institute_rank_value').text().trim();
        const instituteRank = instituteRankText ? parseInt(instituteRankText) : undefined;

        // Extract avatar
        const avatarSrc = $('.profile_pic img').attr('src') || '';
        const avatar = avatarSrc.startsWith('//') ? `https:${avatarSrc}` :
            avatarSrc.startsWith('/') ? `${BASE_URL}${avatarSrc}` : avatarSrc;

        const stats: GfGStats = {
            username,
            codingScore,
            solved: {
                total: totalSolved,
                easy,
                medium,
                hard,
            },
            currentStreak,
            maxStreak,
            instituteRank,
            avatar: avatar || `${BASE_URL}/img/default-profile.png`,
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
        const url = `${BASE_URL}/user/${username}/`;
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
