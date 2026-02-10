import express from 'express';
import cors from 'cors';
import path from 'node:path';
import sheetRoutes from './routes/sheetRoutes.js';
import { loadSheetState } from './services/sheetService.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', sheetRoutes);

const clientDistPath = path.resolve(process.cwd(), '..', 'client', 'dist');

app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof Error) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: 'Unknown error' });
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

loadSheetState().then(() => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
});
