import { HttpException, HttpStatus } from '@nestjs/common';

export class ItemNotFoundException extends HttpException {
  constructor(public readonly itemId: string) {
    super(`Item ${itemId} not found`, HttpStatus.NOT_FOUND);
  }
}
