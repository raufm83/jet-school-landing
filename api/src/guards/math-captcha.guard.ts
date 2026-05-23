import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { CaptchaService } from 'src/captcha/captcha.service';

@Injectable()
export class MathCaptchaGuard implements CanActivate {
  constructor(private readonly captchaService: CaptchaService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    this.stripCaptchaFromBody(req);
    return true;
  }

  private stripCaptchaFromBody(req: any) {
    if (req?.body) {
      delete req.body.mathCaptchaToken;
      delete req.body.mathCaptchaAnswer;
    }
  }
}
