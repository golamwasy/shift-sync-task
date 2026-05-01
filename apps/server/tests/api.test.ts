import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import Fastify from 'fastify';
import healthRoutes from '../src/presentation/routes/health.route';
import aiRoutes from '../src/presentation/routes/ai.route';
import { container } from '../src/infrastructure/di/container';

describe('Server API Integration Tests', () => {
  let fastify: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    fastify = Fastify();
    fastify.register(healthRoutes);
    fastify.register(aiRoutes, { prefix: '/ai' });
    
    // Mock the GeminiService directly in the container to avoid external calls
    const mockGeminiService = {
      parseTaskText: vi.fn().mockResolvedValue({
        title: "Mocked Meeting",
        category: "Work",
        scheduledAt: "2026-06-01T15:00:00Z"
      })
    };
    
    // Replace the real service with the mock
    container.register({
      geminiService: require('awilix').asValue(mockGeminiService)
    });

    await fastify.ready();
  });

  afterAll(async () => {
    await fastify.close();
  });

  it('1. AI correctly parses a date (mocked)', async () => {
    const response = await supertest(fastify.server)
      .post('/ai/parse')
      .send({ text: 'Meeting with Helsinki team next Tuesday at 3pm' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.title).toBe('Mocked Meeting');
    expect(response.body.data.scheduledAt).toBe('2026-06-01T15:00:00Z');
  });

  it('2. Health endpoint returns uptime', async () => {
    const response = await supertest(fastify.server)
      .get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.uptime).toBeDefined();
    expect(typeof response.body.uptime).toBe('number');
  });

  it('3. Invalid task payload returns 400 Bad Request', async () => {
    const response = await supertest(fastify.server)
      .post('/ai/parse')
      .send({ invalidKey: 'No text provided' }); // Missing 'text' property

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details).toBeDefined();
    expect(response.body.details[0].message).toBe('Text input is required');
  });
});
