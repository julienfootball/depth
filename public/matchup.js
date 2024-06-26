document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const friendUsername = params.get('friend');
    const userPlayers = document.getElementById('userPlayerList');
    const friendPlayers = document.getElementById('friendPlayerList');
    const userRankingsHeader = document.getElementById('userRankingsHeader');
    const friendRankingsHeader = document.getElementById('friendRankingsHeader');
    const TEAM_SIZE = 5;

    fetch('/get-username')
        .then(response => response.json())
        .then(data => {
            const username = data.username;
            console.log('Username:', username);

            userRankingsHeader.textContent = `${username}'s Rankings`;

            fetch(`/get-player-rankings?friend=${friendUsername}`)
                .then(response => response.json())
                .then(rankings => {
                    const { userRankings, friendRankings } = rankings;
                    console.log('User Rankings:', userRankings);
                    console.log('Friend Rankings:', friendRankings);

                    friendRankingsHeader.textContent = `${friendUsername}'s Rankings`;

                    const userTeam = [];
                    const friendTeam = [];
                    const playersAssigned = new Set();

                    // Iterate through rankings
                    for (let i = 0; i < userRankings.length && i < friendRankings.length; i++) {
                        const userPlayer = userRankings[i];
                        const friendPlayer = friendRankings[i];

                        console.log(`Evaluating: User Player - ${userPlayer}, Friend Player - ${friendPlayer}`);

                        // Skip equally ranked players
                        if (userPlayer === friendPlayer) {
                            console.log(`Skipping equally ranked player: ${userPlayer}`);
                            continue;
                        }

                        // Find indices of the current players in the other user's rankings
                        const userPlayerIndexInFriendRankings = friendRankings.indexOf(userPlayer);
                        const friendPlayerIndexInUserRankings = userRankings.indexOf(friendPlayer);

                        // Check if either player is unassignable (ranked lower than the opposing friend)
                        if (userPlayerIndexInFriendRankings !== -1 && userPlayerIndexInFriendRankings < i) {
                            console.log(`Skipping unassignable player for user: ${userPlayer}`);
                            continue;
                        }

                        if (friendPlayerIndexInUserRankings !== -1 && friendPlayerIndexInUserRankings < i) {
                            console.log(`Skipping unassignable player for friend: ${friendPlayer}`);
                            continue;
                        }

                        // Assign players to teams if both conditions are met for both users
                        if (!playersAssigned.has(userPlayer) && !playersAssigned.has(friendPlayer) && userTeam.length < TEAM_SIZE && friendTeam.length < TEAM_SIZE) {
                            userTeam.push({ player: userPlayer, rank: i + 1 });
                            friendTeam.push({ player: friendPlayer, rank: i + 1 });
                            playersAssigned.add(userPlayer);
                            playersAssigned.add(friendPlayer);
                        }

                        // Stop when both teams are full
                        if (userTeam.length >= TEAM_SIZE && friendTeam.length >= TEAM_SIZE) {
                            break;
                        }
                    }

                    console.log('User Team:', userTeam);
                    console.log('Friend Team:', friendTeam);

                    populatePlayerList(userPlayers, userTeam);
                    populatePlayerList(friendPlayers, friendTeam);
                })
                .catch(error => console.error('Error fetching player rankings:', error));
        })
        .catch(error => console.error('Error fetching username:', error));

    function populatePlayerList(listElement, team) {
        listElement.innerHTML = '';
        team.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${item.rank}. ${item.player}`;
            listElement.appendChild(listItem);
        });
    }

    const backButton = document.getElementById('backButton');
    backButton.addEventListener('click', () => {
        window.location.href = '/index.html';
    });
});
