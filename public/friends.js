document.addEventListener('DOMContentLoaded', () => {
    const addFriendForm = document.getElementById('addFriendForm');
    const friendList = document.getElementById('friendList');
    const backButton = document.getElementById('backButton');

    // Fetch and display friends list
    fetch('/get-friends')
        .then(response => response.json())
        .then(data => {
            populateFriendList(data.friends);
        })
        .catch(error => console.error('Error fetching friends:', error));

    addFriendForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const friendUsername = document.getElementById('friendUsername').value;

        fetch('/add-friend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendUsername })
        })
        .then(response => response.text())
        .then(data => {
            console.log(data);
            fetch('/get-friends')
                .then(response => response.json())
                .then(data => {
                    populateFriendList(data.friends);
                })
                .catch(error => console.error('Error fetching friends:', error));
        })
        .catch(error => console.error('Error adding friend:', error));
    });

    function populateFriendList(friends) {
        friendList.innerHTML = ''; // Clear existing list
        friends.forEach(friend => {
            const listItem = document.createElement('li');
            listItem.textContent = friend;

            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.addEventListener('click', () => removeFriend(friend));
            listItem.appendChild(removeButton);

            const matchupButton = document.createElement('button');
            matchupButton.textContent = 'View Matchup';
            matchupButton.addEventListener('click', () => viewMatchup(friend));
            listItem.appendChild(matchupButton);

            friendList.appendChild(listItem);
        });
    }

    function removeFriend(friendUsername) {
        fetch('/remove-friend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ friendUsername })
        })
        .then(response => response.text())
        .then(data => {
            console.log(data);
            fetch('/get-friends')
                .then(response => response.json())
                .then(data => {
                    populateFriendList(data.friends);
                })
                .catch(error => console.error('Error fetching friends:', error));
        })
        .catch(error => console.error('Error removing friend:', error));
    }

    function viewMatchup(friendUsername) {
        window.location.href = `/matchup.html?friend=${friendUsername}`;
    }

    backButton.addEventListener('click', () => {
        window.location.href = '/index.html'; // Assuming this is the home page
    });
});
