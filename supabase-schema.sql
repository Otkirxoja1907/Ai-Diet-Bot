-- Users jadvali
CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  tier TEXT DEFAULT 'free',
  tier_expiry TIMESTAMPTZ,
  chat_used_today INT DEFAULT 0,
  last_reset_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments jadvali
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  tier TEXT NOT NULL,
  amount INT NOT NULL,
  currency TEXT DEFAULT 'UZS',
  telegram_payment_charge_id TEXT,
  provider_payment_charge_id TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS ni o'chirish (bot server-side uchun)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON payments FOR ALL USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
