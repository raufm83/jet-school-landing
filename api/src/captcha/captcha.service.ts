import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const CAPTCHA_TTL_MS = 5 * 60 * 1000;

type MathCaptchaPayload = {
  nonce: string;
  expiresAt: number;
  answerHash: string;
};

@Injectable()
export class CaptchaService {
  generateMathCaptcha() {
    const left = this.randomInt(2, 9);
    const right = this.randomInt(1, 9);
    const answer = left + right;
    const nonce = randomBytes(16).toString('hex');
    const expiresAt = Date.now() + CAPTCHA_TTL_MS;
    const payload: MathCaptchaPayload = {
      nonce,
      expiresAt,
      answerHash: this.hashAnswer(nonce, answer),
    };

    return {
      question: `${left} + ${right}`,
      token: this.signPayload(payload),
      expiresAt,
    };
  }

  verifyMathCaptcha(token: unknown, answer: unknown): boolean {
    if (typeof token !== 'string' || typeof answer !== 'string') {
      return false;
    }

    const payload = this.parseToken(token);
    if (!payload || payload.expiresAt < Date.now()) {
      return false;
    }

    const normalizedAnswer = answer.trim();
    if (!/^\d+$/.test(normalizedAnswer)) {
      return false;
    }

    const expectedHash = payload.answerHash;
    const receivedHash = this.hashAnswer(
      payload.nonce,
      Number(normalizedAnswer),
    );

    return this.safeCompare(expectedHash, receivedHash);
  }

  private signPayload(payload: MathCaptchaPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
      'base64url',
    );
    const signature = this.hmac(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  private parseToken(token: string): MathCaptchaPayload | null {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
      return null;
    }

    if (!this.safeCompare(this.hmac(encodedPayload), signature)) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as MathCaptchaPayload;

      if (
        typeof payload.nonce !== 'string' ||
        typeof payload.expiresAt !== 'number' ||
        typeof payload.answerHash !== 'string'
      ) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private hashAnswer(nonce: string, answer: number) {
    return this.hmac(`${nonce}:${answer}`);
  }

  private hmac(value: string) {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }

  private safeCompare(left: string, right: string) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }

  private randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private get secret() {
    return (
      process.env.MATH_CAPTCHA_SECRET ||
      process.env.JWT_SECRET ||
      'jet-school-local-math-captcha-secret'
    );
  }
}
