import { getPublicKey, nip04 } from 'nostr-tools';
import { relayInit } from 'nostr-tools';

export class NostrWalletConnect {
  constructor(connectionUri) {
    const url = new URL(connectionUri);
    this.pubkey = url.pathname.slice(2);
    this.relay = url.searchParams.get('relay') || '';
    this.secret = url.searchParams.get('secret') || '';
    this.relayInstance = relayInit(this.relay);
  }

  async connect() {
    await this.relayInstance.connect();
  }

  async disconnect() {
    await this.relayInstance.close();
  }

  async createEvent(kind, content) {
    const event = {
      kind,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', this.pubkey]],
      content,
      pubkey: getPublicKey(this.secret),
    };
    return event;
  }

  async sendRequest(method, params) {
    const content = JSON.stringify({ method, params });
    const encryptedContent = await nip04.encrypt(this.secret, this.pubkey, content);
    const event = await this.createEvent(23194, encryptedContent);
    
    const pub = this.relayInstance.publish(event);
    await Promise.race([pub.onOk, pub.onFailed]);

    return new Promise((resolve, reject) => {
      const sub = this.relayInstance.sub([
        {
          kinds: [23195],
          authors: [this.pubkey],
          '#e': [event.id],
        }
      ]);

      sub.on('event', async (event) => {
        const decrypted = await nip04.decrypt(this.secret, event.pubkey, event.content);
        const response = JSON.parse(decrypted);
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
        sub.unsub();
      });
    });
  }

  async payInvoice(invoice, amount) {
    const params = { invoice, amount };
    return this.sendRequest('pay_invoice', params);
  }

  async getBalance() {
    return this.sendRequest('get_balance', {});
  }

  // Add more methods as needed (e.g., makeInvoice, lookupInvoice, etc.)
}