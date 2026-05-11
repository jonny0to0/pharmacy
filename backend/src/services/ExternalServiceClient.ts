import { createHash } from 'crypto';
import { getRequestId } from '../middleware/correlation.js';

interface ServiceOptions {
  service: string;
  endpoint: string;
  requestId?: string;
  timeoutMs?: number;
  retries?: number;
}

export class ExternalServiceClient {
  private static DEFAULT_TIMEOUT = 5000;
  private static DEFAULT_RETRIES = 2;

  /**
   * Highly-reliable wrapper for simulated external calls (Payments, HSM, KMS)
   * Ensures trace continuity and normalized observability.
   */
  static async call(options: ServiceOptions, payload: any = {}): Promise<any> {
    const resolvedId = options.requestId || getRequestId() || `trace_${Math.random().toString(36).slice(2, 10)}`;
    const { service, endpoint, timeoutMs = this.DEFAULT_TIMEOUT, retries = this.DEFAULT_RETRIES } = options;
    const start = Date.now();
    const spanId = `span_${Math.random().toString(36).slice(2, 10)}`;

    console.log(`📡 [OUTBOUND] ${resolvedId} | Span: ${service}.${endpoint} [${spanId}]`);

    let attempt = 0;
    while (attempt <= retries) {
      try {
        // --- SIMULATED NETWORK OVERHEAD ---
        const jitter = Math.floor(Math.random() * 50);
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, jitter);
          if (jitter > timeoutMs) reject(new Error("ETIMEDOUT"));
        });

        // --- SUCCESS SIMULATION ---
        const durationMs = Date.now() - start;
        console.log(`✅ [EXTERNAL_OK] ${requestId} | ${service} returned 200 OK (${durationMs}ms)`);

        return {
          status: 'SUCCESS',
          trace: { requestId, spanId, durationMs },
          data: payload,
          fingerprint: createHash('sha256').update(JSON.stringify(payload) + requestId).digest('hex')
        };

      } catch (err: any) {
        attempt++;
        if (attempt > retries) {
           console.error(`❌ [EXTERNAL_ERR] ${requestId} | ${service} FAILED after ${attempt} attempts. Error: ${err.message}`);
           throw new Error(`Service ${service} unavailable: ${err.message}`);
        }
        console.warn(`⚠️ [RETRYING] ${service} attempt ${attempt}...`);
      }
    }
  }

  /**
   * Helper for specific common external interactions
   */
  static async chargePayment(requestId: string, amount: number) {
    return this.call({ service: 'PAYMENTS', endpoint: '/charge', requestId }, { amount, currency: 'USD' });
  }

  static async pushHsmAnchor(requestId: string, anchorId: string, payload: any) {
    return this.call({ service: 'HSM_STORE', endpoint: '/push', requestId, retries: 5 }, { anchorId, payload });
  }
}
