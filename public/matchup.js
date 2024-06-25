document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const friendUsername = params.get('friend');
    const matchupTitle = document.getElementById('matchupTitle');
    const backButton = document.getElementById('backButton');
    const userPlayers = document.getElementById('userPlayers');
    const friendPlayers = document.getElementById('friendPlayers');
    const TEAM_SIZE = 5;

    fetch('/get-username')
        .then(response => response.json())
        .then(data => {
            const username = data.username;

            fetch(`/get-player-rankings?friend=${friendUsername}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(rankings => {
                    const { userRankings, friendRankings } = rankings;
                    const userTeam = [];
                    const friendTeam = [];
                    const playersAssigned = new Set();
                    const playersRemoved = new Set();

                    let i = 0;
                    let attempts = 0;
                    const MAX_ATTEMPTS = 1000;

                    while (userTeam.length < TEAM_SIZE && friendTeam.length < TEAM_SIZE && attempts < MAX_ATTEMPTS) {
                        const userPlayer = userRankings[i];
                        const friendPlayer = friendRankings[i];

                        if (!playersAssigned.has(userPlayer) && !playersRemoved.has(userPlayer) && !playersAssigned.has(friendPlayer) && !playersRemoved.has(friendPlayer)) {
                            if (userPlayer === friendPlayer) {
                                playersRemoved.add(userPlayer);
                            } else {
                                userTeam.push({ player: userPlayer, rank: i + 1 });
                                friendTeam.push({ player: friendPlayer, rank: i + 1 });
                                playersAssigned.add(userPlayer);
                                playersAssigned.add(friendPlayer);
                            }
                        }

                        i++;
                        attempts++;
                        if (i >= userRankings.length || i >= friendRankings.length) {
                            break;
                        }
                    }

                    userTeam.forEach((item, index) => {
                        const listItem = document.createElement('li');
                        listItem.textContent = `${item.rank}. ${item.player}`;
                        userPlayers.appendChild(listItem);

                        const friendItem = document.createElement('li');
                        if (friendTeam[index]) {
                            friendItem.textContent = `${friendTeam[index].rank}. ${friendTeam[index].player}`;
                        } else {
                            friendItem.textContent = '';
                        }
                        friendPlayers.appendChild(friendItem);
                    });
                })
                .catch(error => console.error('Error fetching player rankings:', error));
        })
        .catch(error => console.error('Error fetching username:', error));

    backButton.addEventListener('click', () => {
        window.location.href = '/index.html';
    });
});
