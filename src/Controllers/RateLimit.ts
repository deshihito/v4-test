class RateLimit {
  private readonly time: { [key: string]: Date };
  private readonly rate: number;
  private readonly isWait: boolean;

  constructor(rate: number, isWait: boolean) {
    this.time = {};
    this.rate = rate;
    this.isWait = isWait;
  }

  public count(id: string): boolean {
    if (this.time[id] && new Date().getTime() - this.time[id].getTime() <= this.rate) {
      if (!this.isWait) {
        this.time[id] = new Date();
      }

      return true;
    } else {
      this.time[id] = new Date();

      return false;
    }
  }

  public check(id: string): boolean {
    return this.time[id] && new Date().getTime() - this.time[id].getTime() <= this.rate;
  }

  public get(id: string): Date {
    return this.time[id] || new Date();
  }
}

export default RateLimit;
