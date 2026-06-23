export class InsufficientInventoryError extends Error {
  constructor(message = 'Insufficient inventory') {
    super(message);
    this.name = 'InsufficientInventoryError';
  }
}

export class InvalidVariantChangeError extends Error {
  constructor(message = 'Invalid variant change') {
    super(message);
    this.name = 'InvalidVariantChangeError';
  }
}
