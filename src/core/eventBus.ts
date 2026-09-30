// GeoLog Event Bus - синхронизация между компонентами (7.1)
type Listener = (payload: any) => void;

class EventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: Listener) {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, payload?: any) {
    this.listeners.get(event)?.forEach((fn) => {
      try { fn(payload); } catch (e) { console.error(`Bus error [${event}]:`, e); }
    });
  }
}

export const bus = new EventBus();
