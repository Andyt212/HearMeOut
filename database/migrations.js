const pool = require('../config/database');

async function runMigrations() {
    try {
        // Create characters table with name as primary key
        await pool.query(`
            CREATE TABLE IF NOT EXISTS characters (
                name VARCHAR(255) PRIMARY KEY,
                show VARCHAR(255) NOT NULL,
                image_url VARCHAR(255),
                up_votes INTEGER DEFAULT 0,
                down_votes INTEGER DEFAULT 0
            );
        `);

        // Create comments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                comment_text TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create submissions table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS submissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                show VARCHAR(255) NOT NULL,
                image_url TEXT
            );
        `);

        console.log('Migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error running migrations:', error);
        process.exit(1);
    }
}

runMigrations();