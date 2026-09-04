import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';
import * as argon2 from 'argon2';

// Mock argon2 to avoid heavy hashing in unit tests
vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed'),
  verify: vi.fn().mockResolvedValue(true),
}));

describe('AuthService login', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  } as any;

  const mockJwt = {
    sign: vi.fn().mockReturnValue('token'),
    verify: vi.fn().mockReturnValue({ sub: 'u1' }),
  } as any;

  const mockConfig = {
    get: vi.fn().mockReturnValue('secret'),
  } as any;

  it('returns tokens on valid login', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'STUDENT',
      status: 'ACTIVE',
      passwordHash: 'hashed',
    });

    const service = new AuthService(mockPrisma, mockJwt, mockConfig);
    const result = await service.login({ email: 'test@example.com', password: 'password' });

    expect(result.tokens.accessToken).toBe('token');
    expect(result.tokens.refreshToken).toBe('token');
    expect(result.user.email).toBe('test@example.com');
  });

  it('throws on inactive user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'test@example.com',
      status: 'INACTIVE',
      passwordHash: 'hashed',
    });

    const service = new AuthService(mockPrisma, mockJwt, mockConfig);
    await expect(service.login({ email: 'test@example.com', password: 'password' }))
      .rejects.toThrow('Invalid credentials');
  });

  it('throws on non-existent user', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const service = new AuthService(mockPrisma, mockJwt, mockConfig);
    await expect(service.login({ email: 'missing@example.com', password: 'password' }))
      .rejects.toThrow('Invalid credentials');
  });
});
