export class Buffer {
  constructor(private buf: string = "") {}

  push(s: string): void {
    this.buf += s;
  }

  done(): string {
    return this.buf;
  }
}
