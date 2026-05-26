import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../servers/app.js';
import {ENV} from '../../env.js';

describe('GET /', () => {
  it('returns welcome message and environment', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Cookie and Tea API');
    expect(res.body).toHaveProperty('environment', ENV.NODE_ENV);
  });
});

