import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RequestService } from './request.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { MathCaptchaGuard } from 'src/guards/math-captcha.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role, Language } from '@prisma/client';

/** Uğurlu göndərmədən sonra eyni IP üçün minimum gözləmə (ardıcıl spamın qarşısı) */
const IP_SUCCESS_COOLDOWN_MS = 60 * 60 * 1000;
/** Qısa müddətdə çox cəhd (məs. captcha səhvi) — dəqiqədə maks. POST sayı */
const BURST_WINDOW_MS = 60 * 1000;
const BURST_MAX = 8;

export const REQUEST_IP_COOLDOWN_CODE = 'REQUEST_IP_COOLDOWN';

const lastSuccessfulSubmitByIp = new Map<string, number>();
const postAttemptsByIp = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: any): string {
  return (
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers?.['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function pruneSuccessMapIfLarge() {
  if (lastSuccessfulSubmitByIp.size <= 8000) return;
  const cutoff = Date.now() - IP_SUCCESS_COOLDOWN_MS * 2;
  for (const [ip, t] of lastSuccessfulSubmitByIp) {
    if (t < cutoff) lastSuccessfulSubmitByIp.delete(ip);
  }
}

@ApiTags('Requests')
@Controller('requests')
@ApiBearerAuth('JWT-auth')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CRMOPERATOR, Role.COORDINATOR)
  @ApiOperation({
    summary: 'Get all requests',
    description: 'Retrieves a paginated list of all requests',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'List of requests retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              surname: { type: 'string' },
              number: { type: 'string' },
              childAge: { type: 'number' },
              childLanguage: {
                type: 'string',
                enum: Object.values(Language),
              },
              status: { type: 'string' },
              viewedBy: { type: 'string' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.requestService.findAll(page, limit);
  }

  @Post()
  @UseGuards(MathCaptchaGuard)
  @ApiOperation({
    summary: 'Create request',
    description:
      'Creates a new request. Requires a valid math captcha token and answer.',
  })
  @ApiBody({
    type: CreateRequestDto,
    description: 'Request creation payload',
  })
  @ApiResponse({
    status: 201,
    description: 'Request created successfully',
    type: CreateRequestDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({
    status: 429,
    description:
      'Çox tez-tez cəhd və ya eyni IP ilə yeni göndərmə üçün gözləmə (REQUEST_IP_COOLDOWN və ya ümumi rate limit)',
  })
  async createRequest(
    @Body() createRequestDto: CreateRequestDto,
    @Req() req: any,
  ) {
    const ip = getClientIp(req);
    const now = Date.now();

    const lastOk = lastSuccessfulSubmitByIp.get(ip) ?? 0;
    if (now - lastOk < IP_SUCCESS_COOLDOWN_MS) {
      throw new HttpException(
        { message: REQUEST_IP_COOLDOWN_CODE },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let burst = postAttemptsByIp.get(ip);
    if (!burst || now > burst.resetAt) {
      burst = { count: 0, resetAt: now + BURST_WINDOW_MS };
      postAttemptsByIp.set(ip, burst);
    }
    burst.count++;
    if (burst.count > BURST_MAX) {
      throw new HttpException(
        { message: 'Too many requests. Please try again later.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const created = await this.requestService.createRequest(createRequestDto);
    lastSuccessfulSubmitByIp.set(ip, Date.now());
    pruneSuccessMapIfLarge();
    return created;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CRMOPERATOR, Role.COORDINATOR)
  @ApiOperation({
    summary: 'Get request by ID',
    description: 'Retrieves a specific request by its ID',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the request to retrieve',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Request retrieved successfully',
    type: CreateRequestDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async findOne(@Param('id') id: string) {
    return this.requestService.findOne(id);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.STAFF, Role.CRMOPERATOR, Role.COORDINATOR)
  @ApiOperation({
    summary: 'Mark request as viewed',
    description: 'Marks a specific request as viewed by the current user',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the request to mark as viewed',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Request marked as viewed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async markAsViewed(@Param('id') id: string, @Request() req) {
    return this.requestService.markAsViewed(id, req.user.name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Delete request',
    description: 'Deletes a specific request. Only available to admin users.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID of the request to delete',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Request deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires admin role' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  async remove(@Param('id') id: string) {
    return this.requestService.remove(id);
  }
}
