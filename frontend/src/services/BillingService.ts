import api from '../api/axios';

export interface PlanLimit {
  label: string;
  value: string | number;
  total?: number;
}

class BillingService {
  async getSubscriptionStatus() {
    const res = await api.get('/subscriptions/current');
    return res.data;
  }

  async getBillingHistory() {
    // This is currently included in subscriptions/current but could be a separate endpoint
    const res = await api.get('/subscriptions/current');
    return res.data.subscriptions || [];
  }

  async getPaymentMethods() {
    // Feature placeholder
    return [
      { id: '1', type: 'UPI', label: 'Primary UPI', details: 'user@upi', isDefault: true },
      { id: '2', type: 'CARD', label: 'HDFC Bank Visa', details: '**** 4422', isDefault: false }
    ];
  }

  async getTransactionLogs() {
    // Feature placeholder
    return [
      { id: 'tx_1', date: new Date().toISOString(), amount: 499, type: 'Subscription Pro', status: 'SUCCESS' },
      { id: 'tx_2', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), amount: 499, type: 'Subscription Pro', status: 'SUCCESS' }
    ];
  }
}

export default new BillingService();
