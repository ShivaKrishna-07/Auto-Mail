import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import authRoutes from './routes/auth.routes';
import syncRoutes from './routes/sync.routes';
import emailRoutes from './routes/email.routes';
import ragRoutes from './routes/rag.routes';

const app = express();
const port = parseInt(ENV.PORT, 10);

app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Gmail Intelligence API' });
});

import { apiLimiter, syncLimiter } from './middleware/rateLimit.middleware';

// Apply general API rate limiter to all /api routes
app.use('/api', apiLimiter);

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncLimiter, syncRoutes); // Stricter limit for sync
app.use('/api/emails', emailRoutes);
app.use('/api/chat', ragRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port} in ${ENV.NODE_ENV} mode.`);
});
