// Codeforces platform fetcher

import { fetchJSON } from '../utils/fetcher.js';
import { UserNotFoundError, PlatformError } from '../utils/errors.js';
import type {
    CodeforcesStats,
    CodeforcesUserResponse,
    CodeforcesSubmissionsResponse,
    PlatformResult,
    FetchOptions,
} from '../types/index.js';

const PLATFORM = 'Codeforces';
const API_BASE = 'https://codeforces.com/api';

export async function getCodeforces(
    username: string,
    options: FetchOptions = {}
): Promise<PlatformResult<CodeforcesStats>> {
    const timeout = options.timeout ?? 10000;

    try {
        // Fetch user info
        const userUrl = `${API_BASE}/user.info?handles=${username}`;
        const userResponse = await fetchJSON<CodeforcesUserResponse>(userUrl, timeout);

        if (userResponse.status !== 'OK' || !userResponse.result.length) {
            throw new UserNotFoundError(PLATFORM, username);
        }

        const user = userResponse.result[0];

        // Fetch submissions to count solved problems
        const submissionsUrl = `${API_BASE}/user.status?handle=${username}`;
        const submissionsResponse = await fetchJSON<CodeforcesSubmissionsResponse>(
            submissionsUrl,
            timeout
        );

        // Count unique accepted problems
        const solvedProblems = new Set<string>();
        if (submissionsResponse.status === 'OK') {
            submissionsResponse.result.forEach((submission) => {
                if (submission.verdict === 'OK') {
                    const problemId = `${submission.problem.contestId}-${submission.problem.index}`;
                    solvedProblems.add(problemId);
                }
            });
        }

        const stats: CodeforcesStats = {
            username: user.handle,
            rating: user.rating ?? 0,
            maxRating: user.maxRating ?? 0,
            rank: user.rank ?? 'unrated',
            maxRank: user.maxRank ?? 'unrated',
            solved: solvedProblems.size,
            avatar: user.avatar.startsWith('//') ? `https:${user.avatar}` : user.avatar,
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

export async function getCodeforcesRaw(
    username: string,
    options: FetchOptions = {}
): Promise<PlatformResult<CodeforcesUserResponse>> {
    const timeout = options.timeout ?? 10000;

    try {
        const url = `${API_BASE}/user.info?handles=${username}`;
        const response = await fetchJSON<CodeforcesUserResponse>(url, timeout);

        if (response.status !== 'OK') {
            throw new UserNotFoundError(PLATFORM, username);
        }

        return { success: true, data: response };
    } catch (error) {
        if (error instanceof UserNotFoundError) {
            return { success: false, error: error.message };
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: new PlatformError(PLATFORM, message).message };
    }
}
