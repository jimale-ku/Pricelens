import { Test, TestingModule } from '@nestjs/testing';
import { StoreLocationsService } from './store-locations.service';

describe('StoreLocationsService', () => {
  let service: StoreLocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StoreLocationsService],
    }).compile();

    service = module.get<StoreLocationsService>(StoreLocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
