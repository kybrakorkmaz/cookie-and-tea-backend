import request from 'supertest';
import app from '../server/app.js';
import {ENV} from '../../env.js';

describe('GET /', () => {
  it('returns welcome message and environment', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Cookie and TTea API');
    expect(res.body).toHaveProperty('environment');
  });
});

