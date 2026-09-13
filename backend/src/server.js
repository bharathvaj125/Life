import app, { ensureReady } from './app.js';

const PORT = process.env.PORT || 4000;

ensureReady()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`⚔️  Life RPG API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
