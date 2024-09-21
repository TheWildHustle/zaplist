import { Event, getPublicKey, nip04, relayInit } from 'nostr-tools';

export class NostrWalletConnect {
  private pubkey: string;
  private relay: string;
  private secret: string;
  private relayInstance: ReturnType<typeof relayInit>;

  constructor(connectionUri: string) {
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
    try {
      const content = JSON.stringify({ method, params });
      const encryptedContent = await nip04.encrypt(this.secret, this.pubkey, content);
      const event = await this.createEvent(23194, encryptedContent);
      
      const pub = this.relayInstance.publish(event);
      await Promise.race([
        pub.onOk,
        pub.onFailed.catch((error) => {
          throw new Error(`Error publishing event: ${error.message}`);
        }),
      ]);

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
      });
    } catch (error) {
      throw new Error(`Error sending request: ${error.message}`);
    }
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