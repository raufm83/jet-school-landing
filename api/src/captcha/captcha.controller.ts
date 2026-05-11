import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CaptchaService } from './captcha.service';

@ApiTags('Captcha')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get('math')
  @ApiOperation({ summary: 'Riyazi captcha challenge yarat' })
  getMathCaptcha() {
    return this.captchaService.generateMathCaptcha();
  }
}
