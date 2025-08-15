CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_data BYTEA,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);