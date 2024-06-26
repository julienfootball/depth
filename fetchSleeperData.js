import fetch from 'node-fetch';

// URL for Sleeper API to fetch all NFL players data
const sleeperApiUrl = 'https://api.sleeper.app/v1/players/nfl';

async function fetchPlayerData() {
    try {
        const response = await fetch(sleeperApiUrl);
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error fetching data from Sleeper API:', error);
    }
}

fetchPlayerData();
