/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { kafkaBroker, KafkaTopic } from "./src/lib/kafka-service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Kafka Background Consumers (Async Side Effects) ---

// 1. Consumer: Audit Logger
kafkaBroker.subscribe("transactions", (msg) => {
  const value = msg.value as { amount: number };
  console.log(`[Kafka Audit] Logged transaction ${msg.key} - Amount: ${value.amount}`);
});

// 2. Consumer: Fraud Analysis Engine
kafkaBroker.subscribe("transactions", async (msg) => {
  const { amount, accNumber, txId } = msg.value as { amount: number, accNumber: string, txId: string };
  
  // Simulate AI Processing Latency
  await new Promise(r => setTimeout(r, 800));
  
  const result = calculateFraudScore(Number(amount), accNumber);
  
  if (result.risk_level === 'HIGH') {
    kafkaBroker.publish("security_alerts", txId, {
      type: "FRAUD_ATTEMPT",
      severity: "CRITICAL",
      reason: result.reason,
      details: `Account ${accNumber} flagged for ${amount}`,
      timestamp: Date.now()
    });
  } else {
    // Standard processing
    kafkaBroker.publish("user_notifications", txId, {
      type: "TRANSACTION_CONFIRMED",
      message: `Transfer of ${amount} was successful.`,
      timestamp: Date.now()
    });
  }
});

// --- Fraud Detection Logic ---

interface TransactionRecord {
  amount: number;
  timestamp: number;
}

// Mock database for behavioral tracking
const USER_HISTORY: TransactionRecord[] = [
  { amount: 5000, timestamp: Date.now() - 86400000 * 5 },
  { amount: 12000, timestamp: Date.now() - 86400000 * 4 },
  { amount: 8000, timestamp: Date.now() - 86400000 * 3 },
  { amount: 15000, timestamp: Date.now() - 86400000 * 2 },
];

const RECENT_TXS: TransactionRecord[] = [];

const MOCK_RECIPIENTS: Record<string, string> = {
  '1122334455': 'Aarav Sharma',
  '9988776655': 'Priya Singh',
  '5544332211': 'Vikram Mehra',
  '1234567890': 'Ananya Reddy',
  '8888888888': 'Suspicious Merchant (Flagged)',
  '0000000000': 'Test Receiver (Safe)',
};

function calculateFraudScore(amount: number, accNumber: string) {
  const now = Date.now();
  const reasons: string[] = [];
  let score = 0.05;

  // XGBoost Logic Simulation
  const tenMinsAgo = now - 10 * 60 * 1000;
  const recentCount = RECENT_TXS.filter(tx => tx.timestamp > tenMinsAgo).length;
  if (recentCount >= 2) {
    score += 0.35;
    reasons.push("High Velocity");
  }

  const amounts = USER_HISTORY.map(h => h.amount);
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const stdDev = Math.sqrt(amounts.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / amounts.length);
  const zScore = Math.abs(amount - avg) / (stdDev || 1);
  if (zScore > 2.5) {
    score += 0.25;
    reasons.push("Unusual Amount");
  }

  if (accNumber === '8888888888') {
    score += 0.8;
    reasons.push("Blacklisted Recipient");
  }

  const hour = new Date().getHours();
  if (hour >= 0 && hour <= 4) {
    score += 0.15;
    reasons.push("Anomalous Time");
  }

  const finalScore = Math.min(score, 1.0);
  let riskLevel = 'LOW';
  if (finalScore > 0.65) riskLevel = 'HIGH';
  else if (finalScore > 0.25) riskLevel = 'MEDIUM';

  return {
    fraud_score: parseFloat(finalScore.toFixed(2)),
    risk_level: riskLevel,
    reason: reasons.length > 0 ? reasons.join(", ") : "AI Verified"
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/users/check/:accNumber", (req, res) => {
    const { accNumber } = req.params;
    const name = MOCK_RECIPIENTS[accNumber];
    if (name) res.json({ exists: true, name });
    else res.json({ exists: false });
  });

  app.post("/api/predict", (req, res) => {
    const { amount, accNumber, txId = `tx_${Date.now()}` } = req.body;
    
    // Produce event to Kafka instead of blocking for processing
    kafkaBroker.publish("transactions", txId, {
      amount,
      accNumber,
      txId,
      timestamp: Date.now()
    });

    res.json({ status: "ACCEPTED", txId, message: "Transaction queued for processing via Kafka" });
  });

  // --- Real-time Kafka Stream (SSE) ---
  app.get("/api/stream", (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onEvent = ({ topic, message }: { topic: KafkaTopic, message: any }) => {
      res.write(`data: ${JSON.stringify({ topic, ...message })}\n\n`);
    };

    kafkaBroker.on("broadcast", onEvent);

    req.on("close", () => {
      kafkaBroker.off("broadcast", onEvent);
      res.end();
    });
  });

  // Admin and Profile APIs (Simulated)
  app.get("/api/admin/stats", (req, res) => {
    res.json({
      totalUsers: 1,
      totalTransactions: RECENT_TXS.length + 2,
      activeAlerts: RECENT_TXS.length > 3 ? 1 : 0,
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
