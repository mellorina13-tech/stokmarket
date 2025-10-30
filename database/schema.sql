-- TradeMart Database Schema for Neon PostgreSQL

-- 1. USERS TABLE (Kullanıcılar)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  balance DECIMAL(12, 2) DEFAULT 10000.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. PORTFOLIOS TABLE (Portföyler)
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  avg_buy_price DECIMAL(12, 2) NOT NULL,
  total_invested DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);

-- 3. ORDERS TABLE (Siparişler)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'Kargoya Verildi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRANSACTIONS TABLE (İşlem Geçmişi)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  profit_loss DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_users_email ON users(email);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data (optional - for testing)
-- INSERT INTO users (email, password, full_name, balance) 
-- VALUES ('test@test.com', 'test123', 'Test Kullanıcı', 10000.00);
