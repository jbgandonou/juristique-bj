import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PipelineAlertsService } from '../../src/pipeline/pipeline-alerts.service';
import { PipelineAlert } from '../../src/pipeline/entities/pipeline-alert.entity';
import { AlertType, AlertSeverity } from '../../src/pipeline/scrapers/scraper.interface';

describe('PipelineAlertsService', () => {
  let service: PipelineAlertsService;

  const mockAlerts: Partial<PipelineAlert>[] = [
    {
      id: '1',
      type: AlertType.SCRAPE_FAILED,
      severity: AlertSeverity.ERROR,
      message: 'Test failed',
      acknowledged: false,
      createdAt: new Date(),
    },
  ];

  const mockRepo = {
    create: jest.fn((dto) => ({ ...dto })),
    save: jest.fn((entities) => Promise.resolve(entities)),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    findOneByOrFail: jest.fn().mockResolvedValue({ ...mockAlerts[0], acknowledged: true }),
    count: jest.fn().mockResolvedValue(1),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([mockAlerts, 1]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineAlertsService,
        { provide: getRepositoryToken(PipelineAlert), useValue: mockRepo },
      ],
    }).compile();

    service = module.get(PipelineAlertsService);
  });

  it('should create alerts from scraper alerts', async () => {
    const scraperAlerts = [
      {
        type: AlertType.SCRAPE_FAILED,
        severity: AlertSeverity.ERROR,
        message: 'Test error',
      },
    ];
    const result = await service.createFromScraper('job-123', scraperAlerts);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ jobId: 'job-123', type: AlertType.SCRAPE_FAILED }),
    );
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should find all alerts with pagination', async () => {
    const result = await service.findAll({ page: 1, limit: 20 });
    expect(result.data).toEqual(mockAlerts);
    expect(result.total).toBe(1);
  });

  it('should acknowledge an alert', async () => {
    const result = await service.acknowledge('1');
    expect(mockRepo.update).toHaveBeenCalledWith('1', { acknowledged: true });
    expect(result.acknowledged).toBe(true);
  });

  it('should count unacknowledged alerts', async () => {
    const count = await service.countUnacknowledged();
    expect(count).toBe(1);
  });
});
