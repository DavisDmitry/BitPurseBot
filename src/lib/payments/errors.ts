export class PaymentsError extends Error {}
export class SignFailedError extends PaymentsError {}
export class InsufficientBalanceError extends PaymentsError {
  constructor(readonly bytes: bigint, message?: string, options?: ErrorOptions) {
    super(message, options)
  }
}
export class CantSendUnsignedError extends PaymentsError {}
