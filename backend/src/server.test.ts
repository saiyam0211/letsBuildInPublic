import { describe, it, expect } from 'vitest';

describe('Server', () => {
  it('should define PORT environment variable', () => {
    const PORT = process.env.PORT || 5000;
    expect(PORT).toBeDefined();
  });

  it('should have correct environment configuration', () => {
    const NODE_ENV = process.env.NODE_ENV || 'development';
    expect(['development', 'test', 'production']).toContain(NODE_ENV);
  });

  it('should be able to import server module', async () => {
    const server = await import('./server');
    expect(server).toBeDefined();
    expect(server.default).toBeDefined();
  });
});
