import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { seedSettings, updateSettingByKey } from './controllers/settingsController.js';
import { seedSiteContent } from './controllers/siteContentController.js';

const app = express();
const PORT = process.env.PORT || 5000;

let dbReady = false;

connectDB().then(async () => {
  await seedSettings();
  await seedSiteContent();
  await updateSettingByKey('social_facebook', 'https://www.facebook.com/share/1cMaJrQcWF/?mibextid=wwXIfr');
  dbReady = true;
  console.log('DB ready');
}).catch(err => {
  console.error('Seeding failed:', err.message);
  dbReady = true;
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'https://kmti.edu.np' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

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

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests, please try again later.' });
app.use('/api', limiter);
app.use('/api', routes);

app.get('/', (req, res) => res.json({ message: 'KMTI API is running', version: '1.0.0' }));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`KMTI API running on port ${PORT}`));
