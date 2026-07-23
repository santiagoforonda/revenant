import type { EventBusMap, EventName } from "./event-bus.types";

type Listener<T> = (payload: T) => void;

class GameEventBus {
  private listeners: {
    [K in EventName]?: Set<Listener<EventBusMap[K]>>;
  } = {};

  on<K extends EventName>(event: K, listener: Listener<EventBusMap[K]>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    (this.listeners[event] as Set<Listener<EventBusMap[K]>>).add(listener);
  }

  off<K extends EventName>(event: K, listener: Listener<EventBusMap[K]>): void {
    const set = this.listeners[event] as Set<Listener<EventBusMap[K]>> | undefined;
    if (set) {
      set.delete(listener);
    }
  }

  emit<K extends EventName>(event: K, ...args: EventBusMap[K] extends void ? [] : [EventBusMap[K]]): void {
    const set = this.listeners[event];
    if (set) {
      for (const listener of set) {
        (listener as Listener<EventBusMap[K]>)(...args as [EventBusMap[K]]);
      }
    }
  }

  removeAllListeners<K extends EventName>(event?: K): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

export const eventBus = new GameEventBus();
