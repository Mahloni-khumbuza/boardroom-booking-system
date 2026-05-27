import { Test, TestingModule } from '@nestjs/testing';
import { BoardroomsService } from './boardrooms.service';

describe('BoardroomsService', () => {
  let service: BoardroomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BoardroomsService],
    }).compile();

    service = module.get<BoardroomsService>(BoardroomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
