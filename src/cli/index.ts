#!/usr/bin/env node

import { Command } from 'commander';
import Table from 'cli-table3';
import { getAllStats } from '../index.js';
import type { UserHandles } from '../types/index.js';

const program = new Command();

program
    .name('cpstat')
    .description('Fetch competitive programming stats from multiple platforms')
    .version('0.1.0')
    .option('--cf <username>', 'Codeforces username')
    .option('--lc <username>', 'LeetCode username')
    .option('--cc <username>', 'CodeChef username')
    .option('--gfg <username>', 'GeeksforGeeks username')
    .option('--timeout <ms>', 'Request timeout in milliseconds', '10000')
    .parse(process.argv);

const options = program.opts();

const handles: UserHandles = {
    codeforces: options.cf,
    leetcode: options.lc,
    codechef: options.cc,
    gfg: options.gfg,
};

// Check if at least one platform is specified
if (!handles.codeforces && !handles.leetcode && !handles.codechef && !handles.gfg) {
    console.error('Error: Please specify at least one platform username');
    console.log('Example: cpstat --cf tourist --lc neal_wu');
    process.exit(1);
}

async function main() {
    console.log('Fetching stats...\n');

    const stats = await getAllStats(handles, {
        timeout: parseInt(options.timeout),
    });

    const table = new Table({
        head: ['Platform', 'Username', 'Rating/Score', 'Solved', 'Status'],
        colWidths: [15, 20, 15, 15, 20],
    });

    if (stats.codeforces) {
        if (stats.codeforces.success) {
            const data = stats.codeforces.data;
            table.push([
                'Codeforces',
                data.username,
                `${data.rating} (max: ${data.maxRating})`,
                data.solved.toString(),
                `✓ ${data.rank}`,
            ]);
        } else {
            table.push(['Codeforces', handles.codeforces || '', '-', '-', `✗ ${stats.codeforces.error}`]);
        }
    }

    if (stats.leetcode) {
        if (stats.leetcode.success) {
            const data = stats.leetcode.data;
            table.push([
                'LeetCode',
                data.username,
                data.contestRating ? data.contestRating.toFixed(0) : 'N/A',
                `${data.solved.total} (E:${data.solved.easy} M:${data.solved.medium} H:${data.solved.hard})`,
                `✓ Rank #${data.ranking}`,
            ]);
        } else {
            table.push(['LeetCode', handles.leetcode || '', '-', '-', `✗ ${stats.leetcode.error}`]);
        }
    }

    if (stats.codechef) {
        if (stats.codechef.success) {
            const data = stats.codechef.data;
            table.push([
                'CodeChef',
                data.username,
                `${data.rating} (${data.stars}★)`,
                data.solved.toString(),
                `✓ Global #${data.globalRank || 'N/A'}`,
            ]);
        } else {
            table.push(['CodeChef', handles.codechef || '', '-', '-', `✗ ${stats.codechef.error}`]);
        }
    }

    if (stats.gfg) {
        if (stats.gfg.success) {
            const data = stats.gfg.data;
            table.push([
                'GeeksforGeeks',
                data.username,
                `Score: ${data.codingScore}`,
                `${data.solved.total} (E:${data.solved.easy} M:${data.solved.medium} H:${data.solved.hard})`,
                `✓ Streak: ${data.currentStreak}`,
            ]);
        } else {
            table.push(['GeeksforGeeks', handles.gfg || '', '-', '-', `✗ ${stats.gfg.error}`]);
        }
    }

    console.log(table.toString());
}

main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});
