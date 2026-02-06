// LeetCode GraphQL types

export interface LeetCodeStats {
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
    avatar: string;
}

// Raw GraphQL response types
export interface LeetCodeUserProfile {
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

export interface LeetCodeContestRanking {
    userContestRanking: {
        rating: number;
        globalRanking: number;
        attendedContestsCount: number;
    } | null;
}
