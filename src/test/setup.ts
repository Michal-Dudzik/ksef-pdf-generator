import { beforeAll } from 'vitest';
import { initI18next } from '../lib-public/i18n/i18n-init';

beforeAll(async () => {
  await initI18next();
});
