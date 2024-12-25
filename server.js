require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('./config/database');

try {
    const app = express();

    // Middleware
    app.use(express.static('public'));
    app.use(express.json());

    // Configure multer for file storage
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'public/images')  // Store images in public/images folder
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname)  // Add timestamp to filename
        }
    });

    const upload = multer({ storage: storage });

    // Serve index.html
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Handle form submission
    app.post('/api/submit', upload.single('image'), async (req, res) => {
        try {
            const { character_name, source } = req.body;
            
            if (!req.file) {
                return res.status(400).json({ error: 'No image uploaded' });
            }

            const imagePath = `/images/${req.file.filename}`; // Store the relative path

            const query = `
                INSERT INTO submissions (name, show, image_url)
                VALUES ($1, $2, $3)
                RETURNING *
            `;

            await pool.query(query, [character_name, source, imagePath]);
            res.redirect('/');
        } catch (error) {
            console.error('Error inserting submission:', error);
            res.status(500).json({ error: 'Failed to save submission' });
        }
    });

    // Get all characters
    app.get('/api/images', async (req, res) => {
        try {
            const query = 'SELECT name, show, image_url FROM characters';
            const result = await pool.query(query);
            
            const characters = result.rows.map(row => ({
                name: row.name,
                show: row.show,
                image: row.image_url  // Changed from image_path to image_url
            }));

            res.json({ characters });
        } catch (error) {
            console.error('Error fetching characters:', error);
            res.status(500).json({ error: 'Failed to fetch characters' });
        }
    });

    // Get vote percentages
    app.get('/api/percentages/:characterName', async (req, res) => {
        try {
            const characterName = req.params.characterName;
            const query = 'SELECT up_votes, down_votes FROM characters WHERE name = $1';
            const result = await pool.query(query, [characterName]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Character not found' });
            }

            const { up_votes, down_votes } = result.rows[0];
            const totalVotes = up_votes + down_votes;
            
            const percentages = {
                upvotePercentage: totalVotes === 0 ? 0 : (up_votes / totalVotes) * 100,
                downvotePercentage: totalVotes === 0 ? 0 : (down_votes / totalVotes) * 100
            };

            res.json(percentages);
        } catch (error) {
            console.error('Error fetching percentages:', error);
            res.status(500).json({ error: 'Failed to fetch percentages' });
        }
    });

    // Handle votes
    app.post('/api/vote', async (req, res) => {
        try {
            const { characterName, voteType } = req.body;
            
            const query = `
                UPDATE characters 
                SET ${voteType === 'up' ? 'up_votes' : 'down_votes'} = ${voteType === 'up' ? 'up_votes' : 'down_votes'} + 1 
                WHERE name = $1
                RETURNING up_votes, down_votes
            `;
            
            const result = await pool.query(query, [characterName]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Character not found' });
            }

            const { up_votes, down_votes } = result.rows[0];
            const totalVotes = up_votes + down_votes;
            
            const percentages = {
                upvotePercentage: (up_votes / totalVotes) * 100,
                downvotePercentage: (down_votes / totalVotes) * 100
            };

            res.json({ success: true, percentages });
        } catch (error) {
            console.error('Error updating vote:', error);
            res.status(500).json({ error: 'Failed to save vote' });
        }
    });

    // Handle comments
    app.post('/api/comments', async (req, res) => {
        try {
            const { characterName, comment } = req.body;
            
            const query = `
                INSERT INTO comments (name, comment_text)
                VALUES ($1, $2)
                RETURNING id
            `;
            
            const result = await pool.query(query, [characterName, comment]);
            res.json({ success: true, id: result.rows[0].id });
        } catch (error) {
            console.error('Error saving comment:', error);
            res.status(500).json({ error: 'Failed to save comment' });
        }
    });

    // Get comments for a character
    app.get('/api/comments/:characterName', async (req, res) => {
        try {
            const characterName = req.params.characterName;
            
            const query = `
                SELECT * FROM comments 
                WHERE name = $1 
                ORDER BY timestamp ASC
            `;
            
            const result = await pool.query(query, [characterName]);
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching comments:', error);
            res.status(500).json({ error: 'Failed to fetch comments' });
        }
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });

} catch (err) {
    console.error('Server initialization error:', err);
    process.exit(1);
}