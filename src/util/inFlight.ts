export type InFlightResult<T> = { skipped: false; value: T } | { skipped: true };

class InFlight {
  private readonly keys = new Set<string>();

  public async runExclusive<T>(
    key: string,
    fn: () => Promise<T>,
  ): Promise<InFlightResult<T>> {
    if (this.keys.has(key)) return { skipped: true };
    this.keys.add(key);
    try {
      const value = await fn();
      return { skipped: false, value };
    } finally {
      this.keys.delete(key);
    }
  }
}

export default InFlight;
