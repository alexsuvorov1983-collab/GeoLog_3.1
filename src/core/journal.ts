// GeoLog Journal (1.4) — журнал событий
export interface JournalEntry {
  id: string;
  timestamp: string;
  type: 'command' | 'info' | 'warning' | 'error';
  command?: string;
  message: string;
  details?: Record<string, any>;
}

let journalEntries: JournalEntry[] = [];
let listeners: Set<() => void> = new Set();

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const Journal = {
  logEvent(type: JournalEntry['type'], message: string, command?: string, details?: Record<string, any>) {
    const entry: JournalEntry = {
      id: genId(),
      timestamp: new Date().toISOString(),
      type,
      command,
      message,
      details,
    };
    journalEntries.push(entry);
    listeners.forEach((fn) => fn());
    return entry;
  },

  getEntries(): JournalEntry[] {
    return [...journalEntries];
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  clear() {
    journalEntries = [];
    listeners.forEach((fn) => fn());
  }
};
