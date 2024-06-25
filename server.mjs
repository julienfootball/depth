import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import pkg from 'pg';
const { Pool } = pkg;
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Fetch player data from Sleeper API
async function fetchPlayerData() {
    const response = await fetch('https://api.sleeper.app/v1/players/nfl');
    const data = await response.json();
    return data;
}

// Endpoint to get player data
app.get('/player-data', async (req, res) => {
    try {
        const data = await fetchPlayerData();
        res.json(data);
    } catch (err) {
        console.error('Error fetching player data:', err);
        res.status(500).send('Error fetching player data');
    }
});

// Routes for serving HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/rankings.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rankings.html'));
});

app.get('/friends.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'friends.html'));
});

app.get('/matchup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'matchup.html'));
});

// User registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Insert new user
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, password]);
        
        // Fetch default QB rankings
        const defaultRankingsResult = await pool.query('SELECT qb_list FROM default_qb_rankings LIMIT 1');
        const defaultRankings = defaultRankingsResult.rows.length ? JSON.stringify(defaultRankingsResult.rows[0].qb_list) : '[]';

        // Update new user's rankings with default QB rankings
        await pool.query('UPDATE users SET rankings = $1 WHERE username = $2', [defaultRankings, username]);
        
        // Set session user
        req.session.user = username;
        res.send('Registered successfully');
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Error registering user');
    }
});

// User login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            req.session.user = username;
            res.send('Logged in successfully');
        } else {
            res.status(400).send('Invalid credentials');
        }
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Error logging in user');
    }
});

// Add a friend
app.post('/add-friend', async (req, res) => {
    const { friendUsername } = req.body;
    const user = req.session.user;
    if (!user || !friendUsername) {
        return res.status(400).send('Invalid request');
    }
    try {
        await pool.query('INSERT INTO friends (username, friend_username) VALUES ($1, $2) ON CONFLICT DO NOTHING', [user, friendUsername]);
        await pool.query('INSERT INTO friends (username, friend_username) VALUES ($1, $2) ON CONFLICT DO NOTHING', [friendUsername, user]);
        res.send('Friend added successfully');
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Error adding friend');
    }
});

// Remove a friend
app.post('/remove-friend', async (req, res) => {
    const { friendUsername } = req.body;
    const user = req.session.user;
    if (!user || !friendUsername) {
        return res.status(400).send('Invalid request');
    }
    try {
        await pool.query('DELETE FROM friends WHERE username = $1 AND friend_username = $2', [user, friendUsername]);
        await pool.query('DELETE FROM friends WHERE username = $1 AND friend_username = $2', [friendUsername, user]);
        res.send('Friend removed successfully');
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Error removing friend');
    }
});

// Get friends list
app.get('/get-friends', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.status(401).send('Unauthorized');
    }
    try {
        const result = await pool.query('SELECT friend_username FROM friends WHERE username = $1', [user]);
        res.json({ friends: result.rows.map(row => row.friend_username) });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Error fetching friends');
    }
});

// Get user rankings
app.get('/get-rankings', async (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.status(401).send('Unauthorized');
    }

    try {
        const result = await pool.query('SELECT rankings FROM users WHERE username = $1', [user]);
        if (result.rows.length > 0 && result.rows[0].rankings) {
            const rankings = result.rows[0].rankings;
            res.json(rankings);
        } else {
            const defaultResult = await pool.query('SELECT qb_list FROM default_qb_rankings LIMIT 1');
            const defaultRankings = defaultResult.rows.length ? defaultResult.rows[0].qb_list : [];
            res.json(defaultRankings);
        }
    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).send('Error fetching rankings');
    }
});

// Save user rankings
app.post('/save-rankings', async (req, res) => {
    const { rankings } = req.body;
    const user = req.session.user;
    if (!user) {
        return res.status(401).send('Unauthorized');
    }
    try {
        const formattedRankings = JSON.stringify(rankings);
        await pool.query('UPDATE users SET rankings = $1 WHERE username = $2', [formattedRankings, user]);
        res.send('Rankings saved successfully');
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).send('Error saving rankings');
    }
});

// Get player rankings for matchups
app.get('/get-player-rankings', async (req, res) => {
    try {
        const { friend } = req.query;
        const user = req.session.user;

        if (!user) {
            console.error('Unauthorized access attempt');
            return res.status(401).send('Unauthorized');
        }

        console.log(`Fetching rankings for user: ${user} and friend: ${friend}`);

        const userResult = await pool.query('SELECT rankings FROM users WHERE username = $1', [user]);
        const friendResult = await pool.query('SELECT rankings FROM users WHERE username = $1', [friend]);

        if (userResult.rows.length === 0 || friendResult.rows.length === 0) {
            console.error('Rankings not found for user or friend');
            return res.status(404).send('Rankings not found for user or friend');
        }

        let userRankings;
        let friendRankings;
        try {
            userRankings = JSON.parse(userResult.rows[0].rankings);
        } catch (error) {
            console.error('Error parsing user rankings:', error.message);
            return res.status(500).send('Error parsing user rankings');
        }

        try {
            friendRankings = JSON.parse(friendResult.rows[0].rankings);
        } catch (error) {
            console.error('Error parsing friend rankings:', error.message);
            return res.status(500).send('Error parsing friend rankings');
        }

        console.log(`User Rankings: ${userRankings}`);
        console.log(`Friend Rankings: ${friendRankings}`);

        const assignedPlayers = new Set();
        const userFinalRankings = [];
        const friendFinalRankings = [];

        let i = 0;
        while ((userFinalRankings.length < 5 || friendFinalRankings.length < 5) && i < userRankings.length && i < friendRankings.length) {
            const userPlayer = userRankings[i];
            const friendPlayer = friendRankings[i];

            if (!assignedPlayers.has(userPlayer) && !assignedPlayers.has(friendPlayer)) {
                if (userPlayer !== friendPlayer) {
                    if (userFinalRankings.length < 5) {
                        userFinalRankings.push(userPlayer);
                        assignedPlayers.add(userPlayer);
                    }
                    if (friendFinalRankings.length < 5) {
                        friendFinalRankings.push(friendPlayer);
                        assignedPlayers.add(friendPlayer);
                    }
                } else {
                    if (userFinalRankings.length < 5) {
                        userFinalRankings.push(userPlayer);
                        assignedPlayers.add(userPlayer);
                    }
                    if (friendFinalRankings.length < 5) {
                        friendFinalRankings.push(friendPlayer);
                        assignedPlayers.add(friendPlayer);
                    }
                }
            }

            i++;
        }

        res.json({
            userRankings: userFinalRankings,
            friendRankings: friendFinalRankings
        });
    } catch (error) {
        console.error('Error fetching player rankings:', error);
        res.status(500).send('Internal Server Error: ' + error.message);
    }
});

// Get username
app.get('/get-username', (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.status(401).send('Unauthorized');
    }
    res.json({ username: user });
});

// User logout
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.send('Logged out successfully');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
