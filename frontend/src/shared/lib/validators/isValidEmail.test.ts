import { describe, expect, it } from 'vitest';
import { isValidEmail } from './isValidEmail';

describe('isValidEmail', () => {
  it('checks a simple email format', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
  });
});
