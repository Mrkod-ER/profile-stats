import { getAllStats } from './dist/index.js';

async function test() {
    console.log('Testing All Platforms...');
    const result = await getAllStats(
        {
            codeforces: 'tourist',
            leetcode: 'neal_wu',
            codechef: 'tourist',
            gfg: 'shashank21j'
        },
        { timeout: 25000 }
    );

    console.log('Results:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
