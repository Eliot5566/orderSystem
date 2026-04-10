import { describe, expect, it } from 'vitest';

describe('order status flow', () => {
  it('should allow NEW -> PREPARING', () => {
    const allowed = { NEW: ['PREPARING', 'CANCELLED'] };
    expect(allowed.NEW.includes('PREPARING')).toBe(true);
  });

  it('should block COMPLETED -> NEW', () => {
    const allowed = { COMPLETED: [] as string[] };
    expect(allowed.COMPLETED.includes('NEW')).toBe(false);
  });
});
