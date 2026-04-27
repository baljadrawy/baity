/**
 * Unit Tests — withHousehold + Role helpers
 * لا يحتاج DB — يختبر pure functions فقط
 */

import { describe, expect, it } from 'vitest';
import { hasRole, isChild, isParent } from '../with-household';
import type { Role } from '@prisma/client';

describe('hasRole', () => {
  it('OWNER يملك كل الأدوار', () => {
    expect(hasRole('OWNER', 'OWNER')).toBe(true);
    expect(hasRole('OWNER', 'ADMIN')).toBe(true);
    expect(hasRole('OWNER', 'MEMBER')).toBe(true);
    expect(hasRole('OWNER', 'CHILD')).toBe(true);
  });

  it('ADMIN لا يملك OWNER', () => {
    expect(hasRole('ADMIN', 'OWNER')).toBe(false);
    expect(hasRole('ADMIN', 'ADMIN')).toBe(true);
    expect(hasRole('ADMIN', 'MEMBER')).toBe(true);
  });

  it('CHILD هو أدنى دور', () => {
    expect(hasRole('CHILD', 'OWNER')).toBe(false);
    expect(hasRole('CHILD', 'ADMIN')).toBe(false);
    expect(hasRole('CHILD', 'MEMBER')).toBe(false);
    expect(hasRole('CHILD', 'CHILD')).toBe(true);
  });
});

describe('isParent', () => {
  it('OWNER و ADMIN هم آباء', () => {
    expect(isParent('OWNER')).toBe(true);
    expect(isParent('ADMIN')).toBe(true);
  });

  it('MEMBER و CHILD ليسوا آباء', () => {
    expect(isParent('MEMBER')).toBe(false);
    expect(isParent('CHILD')).toBe(false);
  });
});

describe('isChild', () => {
  it('CHILD فقط هو طفل', () => {
    expect(isChild('CHILD')).toBe(true);
  });

  const others: Role[] = ['OWNER', 'ADMIN', 'MEMBER'];
  for (const role of others) {
    it(`${role} ليس طفلاً`, () => {
      expect(isChild(role)).toBe(false);
    });
  }
});
