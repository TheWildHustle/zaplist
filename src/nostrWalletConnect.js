// src/nostrWalletConnect.js

const NIP47_METHODS = {
  PAY_INVOICE: 'pay_invoice',
  GET_BALANCE: 'get_balance',
  GET_INFO: 'get_info',
};

class NostrWalletConnect {
  constructor() {
    this.connected = false;
    this.pubkey = null;
  }

  async connect() {
    if (typeof window.nostr === 'undefined') {
      throw new Error('Nostr provider not found');
    }

    try {
      const pubkey = await window.nostr.getPublicKey();
      this.pubkey = pubkey;
      this.connected = true;
      return pubkey;
    } catch (error) {
      console.error('Failed to connect to Nostr wallet:', error);
      throw error;
    }
  }

  async sendRequest(method, params = {}) {
    if (!this.connected) {
      throw new Error('Not connected to Nostr wallet');
    }

    try {
      const response = await window.nostr.nip47.call(method, params);
      return response;
    } catch (error) {
      console.error(`Failed to execute ${method}:`, error);
      throw error;
    }
  }

  async payInvoice(bolt11) {
    return this.sendRequest(NIP47_METHODS.PAY_INVOICE, { bolt11 });
  }

  async getBalance() {
    return this.sendRequest(NIP47_METHODS.GET_BALANCE);
  }

  async getInfo() {
    return this.sendRequest(NIP47_METHODS.GET_INFO);
  }
}

export default NostrWalletConnect;