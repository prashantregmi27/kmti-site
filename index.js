import 'dotenv/config';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { seedSettings, updateSettingByKey } from './controllers/settingsController.js';
import { seedSiteContent } from './controllers/siteContentController.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
const distPath = join(__dirname, 'dist');

let dbReady = false;

connectDB().then(async () => {
  await seedSettings();
  await seedSiteContent();
  await updateSettingByKey('social_facebook', 'https://www.facebook.com/share/1cMaJrQcWF/?mibextid=wwXIfr');
  dbReady = true;
  console.log('DB ready');
}).catch(err => {
  console.error('DB connection failed:', err.message);
  dbReady = true; // allow server to serve SPA even without DB
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.get('/health', (req, res) => res.json({ ok: true }));

// Wait for DB before accepting API mutations (auth/login works without DB)
app.use('/api', (req, res, next) => {
  if (dbReady || req.path === '/auth/login') return next();
  if (req.method === 'GET') return res.json({ success: true, data: [] });
  let waited = 0;
  const iv = setInterval(() => {
    waited += 200;
    if (dbReady) { clearInterval(iv); next(); }
    else if (waited >= 120000) {
      clearInterval(iv);
      res.status(503).json({ success: false, message: 'Database not ready, try again' });
    }
  }, 200);
});
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use('/api', routes);

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log('KMTI server running on port ' + PORT));
