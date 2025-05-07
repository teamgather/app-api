import { Test, TestingModule } from '@nestjs/testing';
import { UserCacheService } from './user.cache.service';

describe('UserCacheService', () => {
  let service: UserCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserCacheService],
    }).compile();

    service = module.get<UserCacheService>(UserCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
