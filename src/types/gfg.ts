// GeeksforGeeks scraping types

export interface GfGStats {
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
