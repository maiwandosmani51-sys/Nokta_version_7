import { createApp } from './app';
import { config } from './config/env';

async function start() {
  const app = await createApp();
  app.listen(config.port, () => {
    console.log(`Nokta Academy backend running on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error('Server startup failed', error);
  process.exit(1);
});
