// Codeforces API types

export interface CodeforcesStats {
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

// Raw API response types
export interface CodeforcesUserResponse {
    status: string;
    result: CodeforcesUser[];
}

export interface CodeforcesUser {
    handle: string;
    rating?: number;
    maxRating?: number;
    rank?: string;
    maxRank?: string;
    contribution?: number;
    avatar: string;
    titlePhoto: string;
}

export interface CodeforcesSubmissionsResponse {
    status: string;
    result: CodeforcesSubmission[];
}

export interface CodeforcesSubmission {
    id: number;
    contestId?: number;
    problem: {
        contestId: number;
        index: string;
        name: string;
    };
    verdict: string;
}

export interface CodeforcesRatingResponse {
    status: string;
    result: CodeforcesRatingChange[];
}

export interface CodeforcesRatingChange {
    contestId: number;
    contestName: string;
    rank: number;
    oldRating: number;
    newRating: number;
}
