import { getCodeChef } from './src/platforms/codechef';

async function main() {
    try {
        const username = 'king_koder';
        console.log(`Fetching CodeChef stats for ${username}...`);
        const result = await getCodeChef(username);

        if (result.success) {
            console.log('Success!', JSON.stringify(result.data, null, 2));
        } else {
            console.error('Failed:', result.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
