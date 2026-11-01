import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../../src/lib/api-error';

describe('getErrorMessage', () => {
  it('returns backend string message', () => {
    const err = { response: { data: { message: 'Email already in use' } } };
    expect(getErrorMessage(err, 'Lỗi')).toBe('Email already in use');
  });

  it('joins backend message array (class-validator)', () => {
    const err = { response: { data: { message: ['email must be an email', 'name too short'] } } };
    expect(getErrorMessage(err, 'Lỗi')).toBe('email must be an email, name too short');
  });

  it('filters non-string entries in message array', () => {
    const err = { response: { data: { message: ['a', 1, 'b', null] } } };
    expect(getErrorMessage(err, 'Lỗi')).toBe('a, b');
  });

  it('falls back when message array is empty or non-string only', () => {
    expect(getErrorMessage({ response: { data: { message: [] } } }, 'Lỗi')).toBe('Lỗi');
    expect(getErrorMessage({ response: { data: { message: [1, 2] } } }, 'Lỗi')).toBe('Lỗi');
  });

  it('uses error.message for non-axios generic errors', () => {
    expect(getErrorMessage(new Error('Custom boom'), 'Lỗi')).toBe('Custom boom');
  });

  it('ignores generic axios messages and returns fallback', () => {
    expect(getErrorMessage(new Error('Network Error'), 'Không kết nối được')).toBe('Không kết nối được');
    expect(getErrorMessage(new Error('Request failed with status code 500'), 'Lỗi')).toBe('Lỗi');
    expect(getErrorMessage(new Error('timeout of 0ms exceeded'), 'Lỗi')).toBe('Lỗi');
  });

  it('returns fallback for empty/undefined error', () => {
    expect(getErrorMessage(undefined, 'Lỗi')).toBe('Lỗi');
    expect(getErrorMessage({}, 'Lỗi')).toBe('Lỗi');
    expect(getErrorMessage({ response: { data: {} } }, 'Lỗi')).toBe('Lỗi');
  });
});
