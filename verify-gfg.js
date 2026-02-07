
const { getGfG } = require('./dist/index.js');

async function main() {
    try {
        const username = 'koderabhishek';
        console.log(`Fetching GFG stats for ${username}...`);
        const result = await getGfG(username);

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
