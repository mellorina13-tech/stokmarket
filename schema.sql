-- StokMarket Database Schema
-- Neon PostgreSQL Database Setup

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 10000.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio Table
CREATE TABLE IF NOT EXISTS portfolio (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  portfolio_data JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);

-- Add some sample data (optional - for testing)
-- INSERT INTO users (email, password, full_name, balance)
-- VALUES ('test@test.com', '123456', 'Test User', 10000.00);
