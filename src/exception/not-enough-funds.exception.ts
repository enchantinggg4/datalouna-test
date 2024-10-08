import { HttpException, HttpStatus } from '@nestjs/common';

export class NotEnoughFundsException extends HttpException {
  constructor() {
    super(
      'User have insufficient funds for transaction',
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
