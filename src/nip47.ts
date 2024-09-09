import { Event, getPublicKey, nip04, generatePrivateKey } from 'nostr-tools';
import { relayInit } from 'nostr-tools';

export class NostrWalletConnect {
  private pubkey: string;
  private relay: string;
  private secret: string;
  private relayInstance: any;
  private connected: boolean = false;

  constructor(connectionUri?: string) {
    if (connectionUri) {
      const url = new URL(connectionUri);
      this.pubkey = url.pathname.slice(2);
      this.relay = url.searchParams.get('relay') || '';
      this.secret = url.searchParams.get('secret') || '';
    } else {
      this.secret = generatePrivateKey();
      this.pubkey = getPublicKey(this.secret);
      this.relay = 'wss://relay.damus.io'; // Default relay, can be changed
    }
    this.relayInstance = relayInit(this.relay);
  }

  generateConnectionUri(): string {
    return `nostrwalletconnect://${this.pubkey}?secret=${this.secret}&relay=${encodeURIComponent(this.relay)}`;
  }

  async connect() {
    try {
      await this.relayInstance.connect();
      this.connected = true;
      console.log('Connected to relay:', this.relay);
    } catch (error) {
      console.error('Failed to connect to relay:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.relayInstance.close();
      this.connected = false;
      console.log('Disconnected from relay');
    } catch (error) {
      console.error('Failed to disconnect from relay:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async createEvent(kind: number, content: string): Promise<Event> {
    const event: Event = {
      kind,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', this.pubkey]],
      content,
      pubkey: getPublicKey(this.secret),
    };
    return event;
  }

  private async sendRequest(method: string, params: any): Promise<any> {
    if (!this.connected) {
      throw new Error('Not connected to relay. Call connect() first.');
    }

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

      sub.on('event', async (event: Event) => {
        const decrypted = await nip04.decrypt(this.secret, event.pubkey, event.content);
        const response = JSON.parse(decrypted);
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result);
        }
        sub.unsub();
      });

      // Add a timeout
      setTimeout(() => {
        sub.unsub();
        reject(new Error('Request timed out'));
      }, 30000); // 30 seconds timeout
    });
  }

  async getPublicKey(): Promise<string> {
    return this.sendRequest('get_public_key', {});
  }

  async signEvent(event: Event): Promise<Event> {
    return this.sendRequest('sign_event', { event });
  }

  async encrypt(pubkey: string, plaintext: string): Promise<string> {
    return this.sendRequest('encrypt', { pubkey, plaintext });
  }

  async decrypt(pubkey: string, ciphertext: string): Promise<string> {
    return this.sendRequest('decrypt', { pubkey, ciphertext });
  }

  async nip04Encrypt(pubkey: string, plaintext: string): Promise<string> {
    return this.sendRequest('nip04_encrypt', { pubkey, plaintext });
  }

  async nip04Decrypt(pubkey: string, ciphertext: string): Promise<string> {
    return this.sendRequest('nip04_decrypt', { pubkey, ciphertext });
  }

  async payInvoice(invoice: string, amount?: number): Promise<string> {
    const params = { invoice, amount };
    return this.sendRequest('pay_invoice', params);
  }

  async getBalance(): Promise<number> {
    return this.sendRequest('get_balance', {});
  }

  // Add more methods as needed (e.g., makeInvoice, lookupInvoice, etc.)
}