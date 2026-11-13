class LevelGrantStore {
  private readonly grants = new Map<string, number>();

  constructor(
    private readonly intervalMs: number,
    private readonly maxSize: number = 10_000,
    private readonly now: () => number = Date.now,
  ) {}

  private key(userId: string, guildId: string): string {
    return `${guildId}:${userId}`;
  }

  public get size(): number {
    return this.grants.size;
  }

  public isThrottled(userId: string, guildId: string): boolean {
    const last = this.grants.get(this.key(userId, guildId));
    if (last === undefined) return false;
    return this.now() - last < this.intervalMs;
  }

  public record(userId: string, guildId: string, at: number = this.now()): void {
    this.grants.set(this.key(userId, guildId), at);
    if (this.grants.size > this.maxSize) {
      this.pruneExpired();
    }
  }

  public forget(userId: string, guildId: string): void {
    this.grants.delete(this.key(userId, guildId));
  }

  public pruneExpired(): void {
    const cutoff = this.now() - this.intervalMs;
    for (const [key, last] of this.grants) {
      if (last <= cutoff) this.grants.delete(key);
    }
  }
}

export default LevelGrantStore;
