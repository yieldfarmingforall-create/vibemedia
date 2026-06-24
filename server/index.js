import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import crypto from 'crypto';
import pool, { initDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

// Multer — file uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (_, file, cb) => {
    const unique = Date.now() + '-' + Math.random().toString(36).slice(2);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Stripe webhook (raw body BEFORE json middleware) ──────────────────────────
app.post('/api/stripe/webhook', express.raw({ type: '*/*' }), async (req, res) => {
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  if (!STRIPE_WEBHOOK_SECRET) return res.status(500).json({ error: 'Stripe not configured' });

  const rawBody = req.body;
  const sigHeader = req.headers['stripe-signature'];
  if (!sigHeader) return res.status(400).json({ error: 'Missing stripe-signature' });

  const parts = sigHeader.split(',');
  const tPart = parts.find(p => p.startsWith('t='));
  const v1Part = parts.find(p => p.startsWith('v1='));
  if (!tPart || !v1Part) return res.status(400).json({ error: 'Invalid signature' });

  const timestamp = tPart.slice(2);
  const receivedSig = v1Part.slice(3);
  const expectedSig = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET)
    .update(`${timestamp}.${rawBody}`).digest('hex');

  if (expectedSig !== receivedSig) return res.status(401).json({ error: 'Invalid signature' });
  if (Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp)) > 300)
    return res.status(400).json({ error: 'Timestamp too old' });

  const event = JSON.parse(rawBody.toString());

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    const clientId = s.client_reference_id || s.metadata?.clientId;
    const slotId = s.metadata?.slotId;
    if (clientId) {
      await pool.query(
        `UPDATE clients SET payment_status='paid', stripe_session_id=$1, amount_paid=$2 WHERE id=$3`,
        [s.id, s.amount_total, clientId]
      ).catch(console.error);
    }
    if (slotId) {
      await pool.query(
        `UPDATE available_slots SET is_booked=true, booked_by_client_id=$1 WHERE id=$2`,
        [clientId || '', slotId]
      ).catch(console.error);
    }
  }

  if (event.type === 'checkout.session.expired') {
    const s = event.data.object;
    const clientId = s.client_reference_id || s.metadata?.clientId;
    const slotId = s.metadata?.slotId;
    if (clientId) await pool.query(`UPDATE clients SET payment_status='failed' WHERE id=$1`, [clientId]).catch(console.error);
    if (slotId) await pool.query(`UPDATE available_slots SET is_booked=false, booked_by_client_id='' WHERE id=$1`, [slotId]).catch(console.error);
  }

  res.json({ received: true });
});

// JSON middleware for all other routes
app.use(express.json());

// ── Helper ────────────────────────────────────────────────────────────────────
function orderBy(sort, defaultSort = 'created_at ASC') {
  if (!sort) return defaultSort;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  const map = { order: 'order_num', date: 'date', time: 'time', created_date: 'created_at' };
  return `${map[field] || field} ${desc ? 'DESC' : 'ASC'}`;
}

// ── PAGE CONTENT ──────────────────────────────────────────────────────────────
const pcSel = `SELECT id, page_key AS "pageKey", value, label, created_at AS "created_date" FROM page_content`;

app.get('/api/page-content', async (req, res) => {
  try {
    const { _sort, _limit, pageKey, id } = req.query;
    const params = []; const conds = [];
    if (pageKey) { params.push(pageKey); conds.push(`page_key=$${params.length}`); }
    if (id)      { params.push(id);      conds.push(`id::text=$${params.length}`); }
    const where = conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
    const limit = _limit ? ` LIMIT ${Math.min(parseInt(_limit)||100,500)}` : '';
    const r = await pool.query(`${pcSel}${where} ORDER BY ${orderBy(_sort)}${limit}`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/page-content', async (req, res) => {
  try {
    const { pageKey, value = '', label = '' } = req.body;
    const r = await pool.query(
      `INSERT INTO page_content (page_key,value,label) VALUES ($1,$2,$3)
       ON CONFLICT (page_key) DO UPDATE SET value=$2,label=$3
       RETURNING id, page_key AS "pageKey", value, label, created_at AS "created_date"`,
      [pageKey, value, label]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/page-content/:id', async (req, res) => {
  try {
    const cols = ['value','label'];
    const sets = []; const params = [];
    cols.forEach(c => { if (req.body[c] !== undefined) { params.push(req.body[c]); sets.push(`${c}=$${params.length}`); } });
    params.push(req.params.id);
    const r = await pool.query(`UPDATE page_content SET ${sets.join(',')} WHERE id=$${params.length} RETURNING id, page_key AS "pageKey", value, label`, params);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SERVICES ──────────────────────────────────────────────────────────────────
const svcSel = `SELECT id, name, description, price, order_num AS "order", created_at AS "created_date" FROM services`;

app.get('/api/services', async (req, res) => {
  try {
    const { _sort, _limit, id } = req.query;
    const params = []; const conds = [];
    if (id) { params.push(id); conds.push(`id::text=$${params.length}`); }
    const where = conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
    const limit = _limit ? ` LIMIT ${Math.min(parseInt(_limit)||100,100)}` : '';
    const r = await pool.query(`${svcSel}${where} ORDER BY ${orderBy(_sort,'order_num ASC')}${limit}`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/services', async (req, res) => {
  try {
    const { name, description = '', price = 0, order: ord = 0 } = req.body;
    const r = await pool.query(
      `INSERT INTO services (name,description,price,order_num) VALUES ($1,$2,$3,$4) RETURNING id`,
      [name, description, price, ord]
    );
    const row = await pool.query(`${svcSel} WHERE id=$1`, [r.rows[0].id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const map = { name:'name', description:'description', price:'price', order:'order_num' };
    const sets = []; const params = [];
    Object.entries(map).forEach(([k,col]) => { if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${col}=$${params.length}`); } });
    params.push(req.params.id);
    await pool.query(`UPDATE services SET ${sets.join(',')} WHERE id=$${params.length}`, params);
    const row = await pool.query(`${svcSel} WHERE id=$1`, [req.params.id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/services/:id', async (req, res) => {
  try { await pool.query('DELETE FROM services WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── REVIEWS ───────────────────────────────────────────────────────────────────
const revSel = `SELECT id, type, file_url AS "fileUrl", description, order_num AS "order", created_at AS "created_date" FROM reviews`;

app.get('/api/reviews', async (req, res) => {
  try {
    const { _sort, _limit } = req.query;
    const limit = _limit ? ` LIMIT ${Math.min(parseInt(_limit)||100,500)}` : '';
    const r = await pool.query(`${revSel} ORDER BY ${orderBy(_sort,'order_num ASC')}${limit}`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { type, fileUrl = '', description = '', order: ord = 0 } = req.body;
    const r = await pool.query(
      `INSERT INTO reviews (type,file_url,description,order_num) VALUES ($1,$2,$3,$4) RETURNING id`,
      [type, fileUrl, description, ord]
    );
    const row = await pool.query(`${revSel} WHERE id=$1`, [r.rows[0].id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/reviews/:id', async (req, res) => {
  try {
    const map = { description:'description', fileUrl:'file_url', order:'order_num' };
    const sets = []; const params = [];
    Object.entries(map).forEach(([k,col]) => { if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${col}=$${params.length}`); } });
    params.push(req.params.id);
    await pool.query(`UPDATE reviews SET ${sets.join(',')} WHERE id=$${params.length}`, params);
    const row = await pool.query(`${revSel} WHERE id=$1`, [req.params.id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try { await pool.query('DELETE FROM reviews WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── SURVEY QUESTIONS ──────────────────────────────────────────────────────────
const sqSel = `SELECT id, text, type, options, order_num AS "order", created_at AS "created_date" FROM survey_questions`;

app.get('/api/survey-questions', async (req, res) => {
  try {
    const { _sort, _limit } = req.query;
    const limit = _limit ? ` LIMIT ${Math.min(parseInt(_limit)||100,200)}` : '';
    const r = await pool.query(`${sqSel} ORDER BY ${orderBy(_sort,'order_num ASC')}${limit}`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/survey-questions', async (req, res) => {
  try {
    const { text, type = 'open', options = [], order: ord = 0 } = req.body;
    const r = await pool.query(
      `INSERT INTO survey_questions (text,type,options,order_num) VALUES ($1,$2,$3,$4) RETURNING id`,
      [text, type, JSON.stringify(options), ord]
    );
    const row = await pool.query(`${sqSel} WHERE id=$1`, [r.rows[0].id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/survey-questions/:id', async (req, res) => {
  try { await pool.query('DELETE FROM survey_questions WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AVAILABLE SLOTS ───────────────────────────────────────────────────────────
const slotSel = `SELECT id, date, time, is_booked AS "isBooked", booked_by_client_id AS "bookedByClientId", created_at AS "created_date" FROM available_slots`;

app.get('/api/slots', async (req, res) => {
  try {
    const { _sort, _limit, isBooked, id } = req.query;
    const params = []; const conds = [];
    if (isBooked !== undefined) { params.push(isBooked === 'true'); conds.push(`is_booked=$${params.length}`); }
    if (id)                      { params.push(id); conds.push(`id::text=$${params.length}`); }
    const where = conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
    const limit = _limit ? ` LIMIT ${Math.min(parseInt(_limit)||200,500)}` : '';
    const r = await pool.query(`${slotSel}${where} ORDER BY ${orderBy(_sort,'date ASC, time ASC')}${limit}`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/slots', async (req, res) => {
  try {
    const { date, time, isBooked = false, bookedByClientId = '' } = req.body;
    const r = await pool.query(
      `INSERT INTO available_slots (date,time,is_booked,booked_by_client_id) VALUES ($1,$2,$3,$4) RETURNING id`,
      [date, time, isBooked, bookedByClientId]
    );
    const row = await pool.query(`${slotSel} WHERE id=$1`, [r.rows[0].id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/slots/:id', async (req, res) => {
  try {
    const map = { isBooked:'is_booked', bookedByClientId:'booked_by_client_id', date:'date', time:'time' };
    const sets = []; const params = [];
    Object.entries(map).forEach(([k,col]) => { if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${col}=$${params.length}`); } });
    params.push(req.params.id);
    await pool.query(`UPDATE available_slots SET ${sets.join(',')} WHERE id=$${params.length}`, params);
    const row = await pool.query(`${slotSel} WHERE id=$1`, [req.params.id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/slots/:id', async (req, res) => {
  try { await pool.query('DELETE FROM available_slots WHERE id=$1', [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ── CLIENTS ───────────────────────────────────────────────────────────────────
const clSel = `SELECT id, service_id AS "serviceId", service_name AS "serviceName", slot_id AS "slotId", slot_date AS "slotDate", slot_time AS "slotTime", contact_email AS "contactEmail", contact_name AS "contactName", contact_phone AS "contactPhone", survey_answers AS "surveyAnswers", stripe_session_id AS "stripeSessionId", payment_status AS "paymentStatus", amount_paid AS "amountPaid", created_at AS "created_date" FROM clients`;

app.get('/api/clients', async (req, res) => {
  try {
    const { _sort, _limit, id } = req.query;
    const params = []; const conds = [];
    if (id) { params.push(id); conds.push(`id::text=$${params.length}`); }
    const where = conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
    const limit = _limit ? ` LIMIT ${Math.min(parseInt(_limit)||200,500)}` : '';
    const r = await pool.query(`${clSel}${where} ORDER BY ${orderBy(_sort,'created_at DESC')}${limit}`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { serviceId='', serviceName='', slotId='', slotDate='', slotTime='', contactEmail='', contactName='', contactPhone='', surveyAnswers='[]', paymentStatus='pending' } = req.body;
    const r = await pool.query(
      `INSERT INTO clients (service_id,service_name,slot_id,slot_date,slot_time,contact_email,contact_name,contact_phone,survey_answers,payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [serviceId,serviceName,slotId,slotDate,slotTime,contactEmail,contactName,contactPhone,surveyAnswers,paymentStatus]
    );
    const row = await pool.query(`${clSel} WHERE id=$1`, [r.rows[0].id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const map = { paymentStatus:'payment_status', stripeSessionId:'stripe_session_id', amountPaid:'amount_paid', serviceId:'service_id', serviceName:'service_name', slotId:'slot_id', slotDate:'slot_date', slotTime:'slot_time', contactEmail:'contact_email', contactName:'contact_name', contactPhone:'contact_phone', surveyAnswers:'survey_answers' };
    const sets = []; const params = [];
    Object.entries(map).forEach(([k,col]) => { if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${col}=$${params.length}`); } });
    if (!sets.length) return res.json({});
    params.push(req.params.id);
    await pool.query(`UPDATE clients SET ${sets.join(',')} WHERE id=$${params.length}`, params);
    const row = await pool.query(`${clSel} WHERE id=$1`, [req.params.id]);
    res.json(row.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ADMIN SETTINGS ────────────────────────────────────────────────────────────
const asSel = `SELECT id, setting_key AS "settingKey", value, created_at AS "created_date" FROM admin_settings`;

app.get('/api/admin-settings', async (req, res) => {
  try {
    const { settingKey, id } = req.query;
    const params = []; const conds = [];
    if (settingKey) { params.push(settingKey); conds.push(`setting_key=$${params.length}`); }
    if (id)         { params.push(id);          conds.push(`id::text=$${params.length}`); }
    const where = conds.length ? ` WHERE ${conds.join(' AND ')}` : '';
    const r = await pool.query(`${asSel}${where} ORDER BY created_at ASC`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin-settings', async (req, res) => {
  try {
    const { settingKey, value = '' } = req.body;
    const r = await pool.query(
      `INSERT INTO admin_settings (setting_key,value) VALUES ($1,$2)
       ON CONFLICT (setting_key) DO UPDATE SET value=$2
       RETURNING id, setting_key AS "settingKey", value, created_at AS "created_date"`,
      [settingKey, value]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin-settings/:id', async (req, res) => {
  try {
    const { value } = req.body;
    const r = await pool.query(
      `UPDATE admin_settings SET value=$1 WHERE id=$2 RETURNING id, setting_key AS "settingKey", value`,
      [value, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── FILE UPLOAD ───────────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ file_url: fileUrl });
});

// ── STRIPE CREATE SESSION ─────────────────────────────────────────────────────
app.post('/api/stripe/create-session', async (req, res) => {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe secret key not configured' });

  const { clientId, serviceId, serviceName, priceGrosze, slotId } = req.body;
  if (!clientId || !priceGrosze) return res.status(400).json({ error: 'Missing required fields' });

  const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
  const successUrl = `${origin}/platnosc?status=success&clientId=${clientId}`;
  const cancelUrl  = `${origin}/platnosc?status=cancel&clientId=${clientId}&serviceId=${serviceId}&slotId=${slotId || ''}`;

  const params = new URLSearchParams();
  params.append('mode', 'payment');
  params.append('payment_method_types[]', 'card');
  params.append('payment_method_types[]', 'blik');
  params.append('payment_method_types[]', 'p24');
  params.append('line_items[0][price_data][currency]', 'pln');
  params.append('line_items[0][price_data][unit_amount]', String(priceGrosze));
  params.append('line_items[0][price_data][product_data][name]', serviceName || 'Konsultacja');
  params.append('line_items[0][quantity]', '1');
  params.append('client_reference_id', clientId);
  params.append('success_url', successUrl);
  params.append('cancel_url', cancelUrl);
  params.append('metadata[clientId]', clientId);
  params.append('metadata[serviceId]', serviceId || '');
  params.append('metadata[slotId]', slotId || '');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const session = await response.json();
  if (!response.ok) return res.status(400).json({ error: session.error?.message || 'Stripe error' });
  res.json({ url: session.url, sessionId: session.id });
});

// ── BASE44 COMPAT – silent stubs so SDK doesn't flood console with errors ─────
app.use('/api/apps', (req, res) => {
  res.json({ id: null, public_settings: { requiresAuth: false } });
});

// ── START ─────────────────────────────────────────────────────────────────────
await initDb();
app.listen(PORT, () => console.log(`✓ API server running on port ${PORT}`));
