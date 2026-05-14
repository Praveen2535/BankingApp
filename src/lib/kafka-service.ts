/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from "events";

/**
 * High-Quality Kafka Simulation Architecture
 * Implements a Pub/Sub Producer-Consumer pattern with Topic partitioning logic.
 */

export type KafkaTopic = "transactions" | "security_alerts" | "user_notifications" | "audit_logs";

export interface KafkaMessage<T = any> {
  key: string;
  value: T;
  timestamp: number;
  offset: number;
  partition: number;
}

class KafkaBroker extends EventEmitter {
  private static instance: KafkaBroker;
  private offsetMap: Map<KafkaTopic, number> = new Map();
  private messageStore: Map<KafkaTopic, KafkaMessage[]> = new Map();

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  public static getInstance(): KafkaBroker {
    if (!KafkaBroker.instance) {
      KafkaBroker.instance = new KafkaBroker();
    }
    return KafkaBroker.instance;
  }

  /**
   * Producer: Publish a message to a topic
   */
  public async publish<T>(topic: KafkaTopic, key: string, value: T): Promise<KafkaMessage<T>> {
    const currentOffset = (this.offsetMap.get(topic) || 0) + 1;
    this.offsetMap.set(topic, currentOffset);

    const message: KafkaMessage<T> = {
      key,
      value,
      timestamp: Date.now(),
      offset: currentOffset,
      partition: 0, // Simplified for single-broker simulation
    };

    // Store message for "stream" replayability simulation
    if (!this.messageStore.has(topic)) this.messageStore.set(topic, []);
    this.messageStore.get(topic)!.push(message);

    // Async emit to simulate non-blocking streaming
    setImmediate(() => {
      this.emit(topic, message);
      this.emit("broadcast", { topic, message });
    });

    console.log(`[Kafka Producer] Published to ${topic}: ${key} (Offset: ${currentOffset})`);
    return message;
  }

  /**
   * Consumer: Register a listener for a topic (Consumer Group simulation)
   */
  public subscribe<T>(topic: KafkaTopic, callback: (message: KafkaMessage<T>) => void) {
    this.on(topic, callback);
    console.log(`[Kafka Consumer] Registered for topic: ${topic}`);
  }
}

export const kafkaBroker = KafkaBroker.getInstance();
