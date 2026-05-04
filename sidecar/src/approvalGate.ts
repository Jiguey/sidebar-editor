type Entry = { timer: ReturnType<typeof setTimeout>; resolve: (v: boolean) => void };

const pending = new Map<string, Entry>();

export function waitForToolDecision(callId: string, ttlMs = 120_000): Promise<boolean> {
  return new Promise((resolve) => {
    const entry: Entry = {
      timer: setTimeout(() => {
        if (pending.get(callId) === entry) {
          pending.delete(callId);
          resolve(false);
        }
      }, ttlMs),
      resolve: (approved: boolean) => {
        clearTimeout(entry.timer);
        if (pending.get(callId) === entry) {
          pending.delete(callId);
          resolve(approved);
        }
      },
    };
    pending.set(callId, entry);
  });
}

export function submitToolDecision(callId: string, approved: boolean): void {
  const e = pending.get(callId);
  if (!e) return;
  e.resolve(approved);
}
