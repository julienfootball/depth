document.addEventListener('DOMContentLoaded', () => {
    const dataContainer = document.getElementById('dataContainer');

    fetch('/sleeper-api-raw')
        .then(response => response.json())
        .then(data => {
            dataContainer.textContent = JSON.stringify(data, null, 2);
        })
        .catch(error => {
            console.error('Error fetching Sleeper API data:', error);
            dataContainer.textContent = 'Failed to load data';
        });
});
