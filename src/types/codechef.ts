// CodeChef scraping types

export interface CodeChefStats {
    username: string;
    rating: number;
    maxRating: number;
    stars: number;
    solved: number;
    globalRank?: number;
    countryRank?: number;
    avatar: string;
}
