import { getAllStats } from './dist/index.js';

async function test() {
    console.log('Testing All Platforms...');
    const result = await getAllStats(
        {
            codeforces: 'koderabhishek',
            leetcode: 'Mrkod-ER',
            codechef: 'king_koder',
            gfg: 'koderabhishek'
        },
        { timeout: 25000 }
    );

    console.log('Results:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
