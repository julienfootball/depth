document.addEventListener('DOMContentLoaded', () => {
    const playerList = document.getElementById('playerList');
    const backButton = document.getElementById('backButton');

    // Fetch saved rankings
    fetch('/get-rankings')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched rankings:', data);
            if (data.rankings && data.rankings.length > 0) {
                populatePlayerList(data.rankings);
            } else {
                // Fetch default player data if no rankings are saved
                fetch('/player-data')
                    .then(response => response.json())
                    .then(playerData => {
                        console.log('Fetched player data:', playerData);
                        const players = Object.values(playerData)
                            .filter(player => player.fantasy_positions && player.fantasy_positions.includes('QB') && player.team)
                            .sort((a, b) => a.search_rank - b.search_rank)
                            .map(player => `${player.full_name} (${player.team})`);
                        populatePlayerList(players);
                    })
                    .catch(error => console.error('Error fetching player data:', error));
            }
        })
        .catch(error => console.error('Error fetching rankings:', error));

    function populatePlayerList(players) {
        console.log('Populating player list with:', players);
        playerList.innerHTML = '';
        players.forEach(player => {
            if (player) {
                const listItem = document.createElement('li');
                listItem.textContent = player;
                listItem.draggable = true;
                listItem.addEventListener('dragstart', handleDragStart);
                listItem.addEventListener('dragover', handleDragOver);
                listItem.addEventListener('drop', handleDrop);
                listItem.addEventListener('dragend', saveRankings);
                playerList.appendChild(listItem);
            }
        });
        console.log('Player list populated');
    }

    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.textContent);
    }

    function handleDragOver(e) {
        e.preventDefault();
    }

    function handleDrop(e) {
        e.preventDefault();
        const draggedText = e.dataTransfer.getData('text/plain');
        const droppedItem = e.target;
        const draggedItem = [...playerList.children].find(item => item.textContent === draggedText);
        playerList.insertBefore(draggedItem, droppedItem);
    }

    function saveRankings() {
        const rankings = [...playerList.children].map(item => item.textContent);
        fetch('/save-rankings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rankings })
        }).then(response => response.text()).then(data => {
            console.log('Rankings saved:', data);
        }).catch(error => console.error('Error saving rankings:', error));
    }

    backButton.addEventListener('click', () => {
        window.location.href = '/index.html';
    });
});
