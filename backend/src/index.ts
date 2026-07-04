import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from '@/config';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(morgan('combined'));
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
});

export default app;