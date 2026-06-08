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

connectDB().then(async () => {
  await seedSettings();
  await seedSiteContent();
  await updateSettingByKey('social_facebook', 'https://www.facebook.com/share/1cMaJrQcWF/?mibextid=wwXIfr');
}).catch(err => console.error('Seeding failed:', err.message));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

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

const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.listen(PORT, () => console.log('KMTI server running on port ' + PORT));