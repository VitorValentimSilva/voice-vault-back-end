import { beforeEach, describe, expect, it } from '@jest/globals';

import { PrismaService } from '@/modules/prisma/prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
