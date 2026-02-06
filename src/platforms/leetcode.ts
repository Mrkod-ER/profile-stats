// LeetCode platform fetcher

import { fetchWithTimeout } from '../utils/fetcher.js';
import { UserNotFoundError, PlatformError } from '../utils/errors.js';
import type {
    LeetCodeStats,
    LeetCodeUserProfile,
    LeetCodeContestRanking,
    PlatformResult,
    FetchOptions,
} from '../types/index.js';

const PLATFORM = 'LeetCode';
const GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql/';

export async function getLeetCode(
    username: string,
    options: FetchOptions = {}
): Promise<PlatformResult<LeetCodeStats>> {
    const timeout = options.timeout ?? 10000;

    try {
        // GraphQL query for user profile and solved problems
        const profileQuery = {
            query: `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              userAvatar
              ranking
            }
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `,
            variables: { username },
        };

        const profileResponse = await fetchWithTimeout(
            GRAPHQL_ENDPOINT,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileQuery),
            },
            timeout
        );

        if (!profileResponse.ok) {
            throw new Error(`HTTP ${profileResponse.status}`);
        }

        const profileData = (await profileResponse.json()) as { data: LeetCodeUserProfile };

        if (!profileData.data.matchedUser) {
            throw new UserNotFoundError(PLATFORM, username);
        }

        const user = profileData.data.matchedUser;

        // GraphQL query for contest ranking
        const contestQuery = {
            query: `
        query userContestRankingInfo($username: String!) {
          userContestRanking(username: $username) {
            rating
            globalRanking
            attendedContestsCount
          }
        }
      `,
            variables: { username },
        };

        const contestResponse = await fetchWithTimeout(
            GRAPHQL_ENDPOINT,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contestQuery),
            },
            timeout
        );

        const contestData = (await contestResponse.json()) as { data: LeetCodeContestRanking };

        // Parse solved problems by difficulty
        const solvedMap: Record<string, number> = {};
        user.submitStats.acSubmissionNum.forEach((item) => {
            solvedMap[item.difficulty] = item.count;
        });

        const stats: LeetCodeStats = {
            username: user.username,
            ranking: user.profile.ranking,
            solved: {
                total: solvedMap['All'] ?? 0,
                easy: solvedMap['Easy'] ?? 0,
                medium: solvedMap['Medium'] ?? 0,
                hard: solvedMap['Hard'] ?? 0,
            },
            contestRating: contestData.data.userContestRanking?.rating,
            contestRanking: contestData.data.userContestRanking?.globalRanking,
            contestsAttended: contestData.data.userContestRanking?.attendedContestsCount,
            avatar: user.profile.userAvatar,
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

export async function getLeetCodeRaw(
    username: string,
    options: FetchOptions = {}
): Promise<PlatformResult<LeetCodeUserProfile>> {
    const timeout = options.timeout ?? 10000;

    try {
        const query = {
            query: `
        query userPublicProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              userAvatar
              ranking
            }
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `,
            variables: { username },
        };

        const response = await fetchWithTimeout(
            GRAPHQL_ENDPOINT,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(query),
            },
            timeout
        );

        const data = (await response.json()) as { data: LeetCodeUserProfile };

        if (!data.data.matchedUser) {
            throw new UserNotFoundError(PLATFORM, username);
        }

        return { success: true, data: data.data };
    } catch (error) {
        if (error instanceof UserNotFoundError) {
            return { success: false, error: error.message };
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: new PlatformError(PLATFORM, message).message };
    }
}
