import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EnvService } from '@/config/envs/env.service';

describe('EnvService', () => {
  let service: EnvService;

  const configServiceMock = {
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnvService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get(EnvService);
  });

  describe('environment helpers', () => {
    it('should return true when environment is development', () => {
      configServiceMock.get.mockReturnValue('development');

      expect(service.isDevelopment).toBe(true);
      expect(service.isTest).toBe(false);
      expect(service.isProduction).toBe(false);
    });

    it('should return true when environment is test', () => {
      configServiceMock.get.mockReturnValue('test');

      expect(service.isDevelopment).toBe(false);
      expect(service.isTest).toBe(true);
      expect(service.isProduction).toBe(false);
    });

    it('should return true when environment is production', () => {
      configServiceMock.get.mockReturnValue('production');

      expect(service.isDevelopment).toBe(false);
      expect(service.isTest).toBe(false);
      expect(service.isProduction).toBe(true);
    });
  });

  describe('clerkWebhookSecret', () => {
    it('should return webhook secret', () => {
      configServiceMock.getOrThrow.mockReturnValue('secret');

      expect(service.clerkWebhookSecret).toBe('secret');

      expect(configServiceMock.getOrThrow).toHaveBeenCalledWith('CLERK_WEBHOOK_SECRET');
    });

    it('should throw when secret is missing', () => {
      configServiceMock.getOrThrow.mockImplementation(() => {
        throw new Error('Missing env');
      });

      expect(() => service.clerkWebhookSecret).toThrow('Missing env');
    });
  });
});
