import type { Id, ISODateString } from "@finance-os/shared";

export class SystemClock {
  now(): ISODateString {
    return new Date().toISOString();
  }
}

export class UuidGenerator {
  generate(): Id {
    return crypto.randomUUID();
  }
}
