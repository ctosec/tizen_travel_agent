import { Controller, Get, Query, Param, Req, Res, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PlacesService } from './places.service.js';
import * as express from 'express';

@Controller('places')
export class PlacesController {
  private readonly logger = new Logger(PlacesController.name);

  constructor(private readonly placesService: PlacesService) {}

  @Get('search')
  async searchPlaces(
    @Query('query') query: string,
    @Query('maxResults') maxResults?: string,
  ) {
    if (!query) {
      throw new HttpException('query parameter is required', HttpStatus.BAD_REQUEST);
    }
    const results = await this.placesService.textSearch(query, parseInt(maxResults || '5', 10));
    return { success: true, data: results };
  }

  @Get('photo/*photoRef')
  async getPhoto(
    @Param('photoRef') photoRef: string | string[],
    @Query('maxWidth') maxWidth: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    // NestJS path-to-regexp v8 wildcard may return array — extract the full path
    const ref = Array.isArray(photoRef) ? photoRef.join('/') : photoRef;
    this.logger.debug(`Photo proxy: ref=${ref}`);
    const url = this.placesService.getPhotoUrl(ref, parseInt(maxWidth || '800', 10));
    if (!url) {
      throw new HttpException('Places API key not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.error(`Places photo API error: ${response.status} ${response.statusText}`);
        throw new HttpException('Failed to fetch photo', HttpStatus.BAD_GATEWAY);
      }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.type(contentType);
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error('Photo proxy error:', error);
      throw new HttpException('Failed to fetch photo', HttpStatus.BAD_GATEWAY);
    }
  }
}
