import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS page_content (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page_key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT,
      label VARCHAR(500),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS services (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price INTEGER DEFAULT 0,
      order_num INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type VARCHAR(10) NOT NULL,
      file_url TEXT,
      description TEXT,
      order_num INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS survey_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      text TEXT NOT NULL,
      type VARCHAR(10) DEFAULT 'open',
      options JSONB DEFAULT '[]',
      order_num INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS available_slots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date VARCHAR(10) NOT NULL,
      time VARCHAR(5) NOT NULL,
      is_booked BOOLEAN DEFAULT FALSE,
      booked_by_client_id VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id VARCHAR(255),
      service_name VARCHAR(255),
      slot_id VARCHAR(255),
      slot_date VARCHAR(10),
      slot_time VARCHAR(5),
      contact_email VARCHAR(255),
      contact_name VARCHAR(255),
      contact_phone VARCHAR(50),
      survey_answers TEXT,
      stripe_session_id VARCHAR(255),
      payment_status VARCHAR(20) DEFAULT 'pending',
      amount_paid INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      setting_key VARCHAR(255) UNIQUE NOT NULL,
      value TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS home_cards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      section VARCHAR(50) NOT NULL,
      identifier VARCHAR(100) DEFAULT '',
      title TEXT DEFAULT '',
      description TEXT DEFAULT '',
      badge VARCHAR(255) DEFAULT '',
      subtitle VARCHAR(255) DEFAULT '',
      is_violet BOOLEAN DEFAULT FALSE,
      order_num INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS faq_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      order_num INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      initials VARCHAR(20) DEFAULT '',
      name VARCHAR(255) NOT NULL,
      role VARCHAR(255) DEFAULT '',
      time VARCHAR(100) DEFAULT '',
      order_num INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS process_steps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      number VARCHAR(50) DEFAULT '',
      title VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      order_num INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✓ Database schema ready');
}

export default pool;
