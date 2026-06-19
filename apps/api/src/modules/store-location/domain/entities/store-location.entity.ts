export class StoreLocationEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly address: string,
    public readonly phone: string | null,
    public readonly mapUrl: string | null,
    public readonly hours: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      phone: this.phone,
      mapUrl: this.mapUrl,
      hours: this.hours,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
