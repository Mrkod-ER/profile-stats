# profile-stats

> Fetch competitive programming stats from Codeforces, LeetCode, CodeChef, and GeeksforGeeks

A lightweight TypeScript SDK to fetch competitive programming statistics from multiple platforms using only usernames. Perfect for portfolio websites, dashboards, and CLI tools.

## Features

- ✅ **4 Platforms**: Codeforces, LeetCode, CodeChef, GeeksforGeeks
- ✅ **Unified API**: Single function to fetch from all platforms in parallel
- ✅ **TypeScript**: Full type definitions included
- ✅ **Dual Package**: ESM + CommonJS support
- ✅ **CLI Tool**: Optional command-line interface
- ✅ **Server-Side**: Designed for Node.js/Next.js API routes
- ✅ **Error Handling**: Graceful failures per platform

## Installation

```bash
npm install profile-stats
```

## Quick Start

```typescript
import { getAllStats } from 'profile-stats';

const stats = await getAllStats({
  codeforces: 'tourist',
  leetcode: 'neal_wu',
  codechef: 'admin',
  gfg: 'user123'
});

if (stats.codeforces?.success) {
  console.log('CF Rating:', stats.codeforces.data.rating);
}
```

## API Reference

### `getAllStats(handles, options?)`

Fetch stats from all specified platforms in parallel.

```typescript
import { getAllStats } from 'profile-stats';

const stats = await getAllStats(
  {
    codeforces: 'tourist',
    leetcode: 'neal_wu',
    codechef: 'admin',
    gfg: 'user123'
  },
  { timeout: 10000 } // Optional: timeout in ms (default: 10000)
);
```

**Returns:**
```typescript
{
  codeforces?: { success: true, data: CodeforcesStats } | { success: false, error: string };
  leetcode?: { success: true, data: LeetCodeStats } | { success: false, error: string };
  codechef?: { success: true, data: CodeChefStats } | { success: false, error: string };
  gfg?: { success: true, data: GfGStats } | { success: false, error: string };
}
```

### Individual Platform Functions

```typescript
import { getCodeforces, getLeetCode, getCodeChef, getGfG } from 'profile-stats';

// Fetch individual platforms
const cf = await getCodeforces('tourist');
const lc = await getLeetCode('neal_wu');
const cc = await getCodeChef('admin');
const gfg = await getGfG('user123');
```

### Raw API Functions

For advanced users who need raw API responses:

```typescript
import { getCodeforcesRaw, getLeetCodeRaw } from 'profile-stats';

const rawCf = await getCodeforcesRaw('tourist');
const rawLc = await getLeetCodeRaw('neal_wu');
```

## Type Definitions

### CodeforcesStats
```typescript
{
  username: string;
  rating: number;
  maxRating: number;
  rank: string;              // e.g., "legendary grandmaster"
  maxRank: string;
  solved: number;
  avatar: string;
}
```

### LeetCodeStats
```typescript
{
  username: string;
  ranking: number;
  solved: { total: number; easy: number; medium: number; hard: number };
  contestRating?: number;
  contestRanking?: number;
  contestsAttended?: number;
  avatar: string;
}
```

### CodeChefStats
```typescript
{
  username: string;
  rating: number;
  maxRating: number;
  stars: number;
  solved: number;
  globalRank?: number;
  countryRank?: number;
  avatar: string;
}
```

### GfGStats
```typescript
{
  username: string;
  codingScore: number;
  solved: { total: number; easy: number; medium: number; hard: number };
  currentStreak: number;
  maxStreak: number;
  instituteRank?: number;
  avatar: string;
}
```

## Usage Examples

### Next.js 13+ Server Component

```tsx
// app/page.tsx
import { getAllStats } from 'profile-stats';

export default async function ProfilePage() {
  const stats = await getAllStats({
    codeforces: 'your_username',
    leetcode: 'your_username'
  });

  return (
    <div>
      {stats.codeforces?.success && (
        <div>
          <h2>Codeforces</h2>
          <p>Rating: {stats.codeforces.data.rating}</p>
          <p>Solved: {stats.codeforces.data.solved}</p>
        </div>
      )}
    </div>
  );
}
```

### Next.js API Route

```typescript
// app/api/profile/route.ts
import { getAllStats } from 'profile-stats';
import { NextResponse } from 'next/server';

export async function GET() {
  const stats = await getAllStats({
    codeforces: 'your_username',
    leetcode: 'your_username'
  });
  
  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 's-maxage=3600' } // Cache for 1 hour
  });
}
```

### Vercel Cron Job

```typescript
// app/api/cron/update-stats/route.ts
import { getAllStats } from 'profile-stats';
import { kv } from '@vercel/kv';

export async function GET() {
  const stats = await getAllStats({
    codeforces: 'your_username',
    leetcode: 'your_username',
    codechef: 'your_username',
    gfg: 'your_username'
  });
  
  // Store in KV or database
  await kv.set('cp-stats', stats);
  
  return Response.json({ updated: true });
}
```

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/update-stats",
    "schedule": "0 */6 * * *"  // Every 6 hours
  }]
}
```

### Error Handling

```typescript
const stats = await getAllStats({
  codeforces: 'invalid_user',
  leetcode: 'valid_user'
});

// Failed platform
if (!stats.codeforces?.success) {
  console.error('CF Error:', stats.codeforces?.error);
  // Output: "[Codeforces] User "invalid_user" not found"
}

// Successful platform still works
if (stats.leetcode?.success) {
  console.log('LC Ranking:', stats.leetcode.data.ranking);
}
```

## CLI Usage

```bash
# Fetch from all platforms
npx cpstat --cf tourist --lc neal_wu --cc admin --gfg user123

# Fetch from specific platforms
npx cpstat --cf tourist --lc neal_wu

# Custom timeout
npx cpstat --cf tourist --timeout 15000
```

### CLI Output

```
Fetching stats...

┌───────────────┬──────────┬─────────────────┬────────────┬─────────────────────┐
│ Platform      │ Username │ Rating/Score    │ Solved     │ Status              │
├───────────────┼──────────┼─────────────────┼────────────┼─────────────────────┤
│ Codeforces    │ tourist  │ 3533 (max:4009) │ 2954       │ ✓ legendary grand..│
│ LeetCode      │ neal_wu  │ 2800            │ 450 (E:... │ ✓ Rank #123         │
└───────────────┴──────────┴─────────────────┴────────────┴─────────────────────┘
```

## Important Notes

### Server-Side Only

This SDK is designed for **Node.js server environments** (Next.js Server Components, API Routes, etc.). It **will not work in browser clients** due to:
- CORS restrictions on CodeChef/GeeksforGeeks
- HTML scraping requires server-side execution

### Rate Limiting

Be mindful of API rate limits:
- Use caching (Redis, KV stores) for production
- Implement reasonable request intervals
- Consider storing results in a database

### Scraping Stability

CodeChef and GeeksforGeeks use HTML scraping. These **may break** if the websites change their structure. Codeforces and LeetCode use official APIs and are more stable.

## Platform Details

| Platform       | Method          | Stability | Notes                              |
|----------------|-----------------|-----------|-------------------------------------|
| Codeforces     | REST API        | ✅ High    | Official public API                |
| LeetCode       | GraphQL API     | ✅ High    | Public GraphQL endpoint            |
| CodeChef       | HTML Scraping   | ⚠️ Medium | May break if website changes       |
| GeeksforGeeks  | HTML Scraping   | ⚠️ Medium | May break if website changes       |

## License

MIT

## Contributing

Issues and pull requests welcome!
