// CodeChef scraping types

export interface CodeChefStats {
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
