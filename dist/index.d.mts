interface UserHandles {
    codeforces?: string;
    leetcode?: string;
    codechef?: string;
    gfg?: string;
}
interface FetchOptions {
    timeout?: number;
}
type PlatformResult<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: string;
};

interface CodeforcesStats {
    username: string;
    rating: number;
    maxRating: number;
    rank: string;
    maxRank: string;
    solved: number;
    contestsCount: number;
    contribution: number;
    avatar: string;
}
interface CodeforcesUserResponse {
    status: string;
    result: CodeforcesUser[];
}
interface CodeforcesUser {
    handle: string;
    rating?: number;
    maxRating?: number;
    rank?: string;
    maxRank?: string;
    contribution?: number;
    avatar: string;
    titlePhoto: string;
}
interface CodeforcesSubmissionsResponse {
    status: string;
    result: CodeforcesSubmission[];
}
interface CodeforcesSubmission {
    id: number;
    contestId?: number;
    problem: {
        contestId: number;
        index: string;
        name: string;
    };
    verdict: string;
}
interface CodeforcesRatingResponse {
    status: string;
    result: CodeforcesRatingChange[];
}
interface CodeforcesRatingChange {
    contestId: number;
    contestName: string;
    rank: number;
    oldRating: number;
    newRating: number;
}

interface LeetCodeStats {
    username: string;
    ranking: number;
    solved: {
        total: number;
        easy: number;
        medium: number;
        hard: number;
    };
    contestRating?: number;
    contestRanking?: number;
    contestsAttended?: number;
    acceptanceRate?: number;
    avatar: string;
}
interface LeetCodeUserProfile {
    matchedUser: {
        username: string;
        profile: {
            realName: string;
            userAvatar: string;
            ranking: number;
        };
        submitStats: {
            acSubmissionNum: Array<{
                difficulty: string;
                count: number;
            }>;
        };
    };
}
interface LeetCodeContestRanking {
    userContestRanking: {
        rating: number;
        globalRanking: number;
        attendedContestsCount: number;
    } | null;
}

interface CodeChefStats {
    username: string;
    rating: number;
    maxRating: number;
    stars: number;
    solved: number;
    contests?: number;
    globalRank?: number;
    countryRank?: number;
    avatar: string;
}

interface GfGStats {
    username: string;
    codingScore: number;
    monthlyScore: number;
    solved: {
        total: number;
        easy: number;
        medium: number;
        hard: number;
    };
    currentStreak: number;
    maxStreak: number;
    instituteRank?: number;
    avatar: string;
}

declare function getCodeforces(username: string, options?: FetchOptions): Promise<PlatformResult<CodeforcesStats>>;
declare function getCodeforcesRaw(username: string, options?: FetchOptions): Promise<PlatformResult<CodeforcesUserResponse>>;

declare function getLeetCode(username: string, options?: FetchOptions): Promise<PlatformResult<LeetCodeStats>>;
declare function getLeetCodeRaw(username: string, options?: FetchOptions): Promise<PlatformResult<LeetCodeUserProfile>>;

declare function getCodeChef(username: string, options?: FetchOptions): Promise<PlatformResult<CodeChefStats>>;
declare function getCodeChefRaw(username: string, options?: FetchOptions): Promise<PlatformResult<string>>;

declare function getGfG(username: string, options?: FetchOptions): Promise<PlatformResult<GfGStats>>;
declare function getGfGRaw(username: string, options?: FetchOptions): Promise<PlatformResult<string>>;

interface AllStats {
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
declare function getAllStats(handles: UserHandles, options?: FetchOptions): Promise<AllStats>;

export { type AllStats, type CodeChefStats, type CodeforcesRatingChange, type CodeforcesRatingResponse, type CodeforcesStats, type CodeforcesSubmission, type CodeforcesSubmissionsResponse, type CodeforcesUser, type CodeforcesUserResponse, type FetchOptions, type GfGStats, type LeetCodeContestRanking, type LeetCodeStats, type LeetCodeUserProfile, type PlatformResult, type UserHandles, getAllStats, getCodeChef, getCodeChefRaw, getCodeforces, getCodeforcesRaw, getGfG, getGfGRaw, getLeetCode, getLeetCodeRaw };
