require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'https://matesu.me', 'http://localhost:8090', 'http://127.0.0.1:8090'] : '*'
}));
app.use(express.json());

// Healthcheck
app.get(['/', '/health'], (req, res) => {
  res.json({ status: 'ok', service: 'matesu-api' });
});

// ---- Database ----
const db = new Database('store.sqlite3');
db.exec(`CREATE TABLE IF NOT EXISTS purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mp_payment_id TEXT UNIQUE,
  release_id TEXT NOT NULL,
  email TEXT NOT NULL,
  token TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// ---- Mercado Pago ----
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});
const preference = new Preference(mpClient);

// ---- Cloudflare R2 (S3-compatible) ----
const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  }
});

// ============================================
// 1. Criar preferência de pagamento
// ============================================
app.post('/api/create-preference', async (req, res) => {
  try {
    const { releaseId, title, priceCents, email } = req.body;

    if (!releaseId || !title || !priceCents || !email) {
      return res.status(400).json({ error: 'missing required fields' });
    }

    const body = {
      items: [{
        id: releaseId,
        title,
        quantity: 1,
        unit_price: priceCents / 100,
        currency_id: 'BRL'
      }],
      payer: { email },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/?purchase=success&release=${releaseId}`,
        failure: `${process.env.FRONTEND_URL}/?purchase=failure`,
        pending: `${process.env.FRONTEND_URL}/?purchase=pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.BACKEND_URL}/webhook`,
    };

    const result = await preference.create({ body });
    res.json({ checkoutUrl: result.init_point, preferenceId: result.id });
  } catch (err) {
    console.error('Create preference error:', err);
    res.status(500).json({ error: 'failed to create preference' });
  }
});

// ============================================
// 2. Webhook de pagamento
// ============================================
app.post('/webhook', async (req, res) => {
  const { type, data } = req.body;
  if (type !== 'payment') return res.sendStatus(200);

  try {
    const payment = await fetch(
      `https://api.mercadopago.com/v1/payments/${data.id}`,
      { headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` } }
    ).then(r => r.json());

    if (payment.status === 'approved') {
      const releaseId = payment.additional_info?.items?.[0]?.id || 'unknown';
      const email = payment.payer?.email || 'unknown';
      const token = jwt.sign(
        { email, releaseId },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      db.prepare(
        `INSERT OR IGNORE INTO purchases (mp_payment_id, release_id, email, token, status)
         VALUES (?, ?, ?, ?, 'approved')`
      ).run(data.id, releaseId, email, token);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err);
    res.sendStatus(200); // always 200 to avoid MP retries
  }
});

// ============================================
// 3. Stream (URL assinada)
// ============================================
app.get('/api/stream/:token/:fileKey', async (req, res) => {
  try {
    jwt.verify(req.params.token, process.env.JWT_SECRET);
    const cmd = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: req.params.fileKey,
    });
    const url = await getSignedUrl(r2, cmd, { expiresIn: 3600 });
    res.redirect(url);
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
});

// ============================================
// 4. Download
// ============================================
app.get('/api/download/:token/:fileKey', async (req, res) => {
  try {
    jwt.verify(req.params.token, process.env.JWT_SECRET);
    const cmd = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: req.params.fileKey,
      ResponseContentDisposition: `attachment; filename="${req.params.fileKey.split('/').pop()}"`,
    });
    const url = await getSignedUrl(r2, cmd, { expiresIn: 60 });
    res.redirect(url);
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
});

// ============================================
// 5. Biblioteca do usuário
// ============================================
app.get('/api/library/:token', async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const rows = db.prepare(
      'SELECT release_id, token FROM purchases WHERE email = ? AND status = ?'
    ).all(decoded.email, 'approved');
    res.json(rows);
  } catch {
    res.status(401).json({ error: 'invalid token' });
  }
});

// ============================================
// Start
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`matesu backend listening on 0.0.0.0:${PORT}`));
