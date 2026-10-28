import { createApp } from './app';
import { env } from './config/env';
import { triageQueue } from './services/triageQueue';

createApp().listen(env.PORT, () => {
  console.log(`BookLeaf API listening on :${env.PORT} (${env.NODE_ENV}, AI=${env.AI_PROVIDER})`);
  triageQueue.startRecovery().catch((err) => {
    console.error('Failed to run triage startup recovery:', err);
  });
});
