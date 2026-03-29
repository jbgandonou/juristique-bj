import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search legal texts' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'countryCode', required: false })
  @ApiQuery({ name: 'themeSlug', required: false })
  @ApiQuery({ name: 'textType', required: false })
  @ApiQuery({ name: 'isInForce', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(
    @Query('q') q?: string,
    @Query('countryCode') countryCode?: string,
    @Query('themeSlug') themeSlug?: string,
    @Query('textType') textType?: string,
    @Query('isInForce') isInForce?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.search({
      q: q || '*',
      countryCode,
      themeSlug,
      textType,
      isInForce: isInForce !== undefined ? isInForce === 'true' : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }
}
