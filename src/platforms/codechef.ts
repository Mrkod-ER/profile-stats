// CodeChef platform fetcher (HTML scraping)

import * as cheerio from 'cheerio';
import { fetchHTML } from '../utils/fetcher.js';
import { UserNotFoundError, PlatformError } from '../utils/errors.js';
import type { CodeChefStats, PlatformResult, FetchOptions } from '../types/index.js';

const PLATFORM = 'CodeChef';
const BASE_URL = 'https://www.codechef.com';

export async function getCodeChef(
    username: string,
    options: FetchOptions = {}
): Promise<PlatformResult<CodeChefStats>> {
    const timeout = options.timeout ?? 10000;

    try {
        const url = `${BASE_URL}/users/${username}`;
        const html = await fetchHTML(url, timeout);
        const $ = cheerio.load(html);

        // Check if user exists
        if ($('h1:contains("404")').length > 0 || $('title:contains("404")').length > 0) {
            throw new UserNotFoundError(PLATFORM, username);
        }

        // Extract rating (current)
        const ratingText = $('.rating-number').first().text().trim();
        const rating = parseInt(ratingText) || 0;

        // Extract max rating
        const maxRatingText = $('.rating-header .small').text();
        const maxRatingMatch = maxRatingText.match(/Highest Rating (\d+)/);
        const maxRating = maxRatingMatch ? parseInt(maxRatingMatch[1]) : rating;

        // Extract stars
        const starsText = $('.rating-star').find('span').length;
        const stars = starsText || 0;

        // Extract solved count
        const solvedText = $('section.rating-data-section.problems-solved h3').text().trim();
        const solved = parseInt(solvedText) || 0;

        // Extract global rank
        const globalRankText = $('.rating-ranks ul li').first().find('.rank').text().trim();
        const globalRank = parseInt(globalRankText.replace(/,/g, '')) || undefined;

        // Extract country rank
        const countryRankText = $('.rating-ranks ul li').eq(1).find('.rank').text().trim();
        const countryRank = parseInt(countryRankText.replace(/,/g, '')) || undefined;

        // Extract avatar
        const avatarSrc = $('.user-profile-photo img').attr('src') || '';
        const avatar = avatarSrc.startsWith('//') ? `https:${avatarSrc}` : avatarSrc;

        const stats: CodeChefStats = {
            username,
            rating,
            maxRating,
            stars,
            solved,
            globalRank,
            countryRank,
            avatar: avatar || `${BASE_URL}/misc/default-profile-image.png`,
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

export async function getCodeChefRaw(
    username: string,
    options: FetchOptions = {}
): Promise<PlatformResult<string>> {
    const timeout = options.timeout ?? 10000;

    try {
        const url = `${BASE_URL}/users/${username}`;
        const html = await fetchHTML(url, timeout);

        if (html.includes('404') || html.includes('Page not found')) {
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
