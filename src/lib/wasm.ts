import { encode as encodeAddress } from '$lib/addresses'

export class WasmWalletError extends Error {}

interface WasmExports {
  init(testnet: boolean): void
  getIdentifier(): void
  signTx(unsignedTxLength: number, inputCount: number): void
}

export interface Callbacks {
  ret?(data: Uint8Array): void
  ask?(data: Uint8Array): void
  err?(error: string): void
}

export class WasmWallet {
  readonly publicKeyHash
  readonly address

  constructor(
    protected readonly memory: WebAssembly.Memory,
    protected readonly wasm: WebAssembly.Instance,
    protected readonly callbacksContainer: { callbacks?: Callbacks | null },
    seed: Uint8Array,
    net: 'main' | 'test'
  ) {
    this.init(seed, net === 'test')
    this.publicKeyHash = this.getIdentifier()
    this.address = encodeAddress(this.publicKeyHash, net)
  }

  get exports(): WasmExports {
    return this.wasm.exports as unknown as WasmExports
  }

  setupCallbacks(callbacks: Callbacks) {
    this.callbacksContainer.callbacks = callbacks
  }

  resetCallbacks() {
    this.callbacksContainer.callbacks = null
  }

  protected init(seed: Uint8Array, testnet: boolean) {
    let error: WasmWalletError | undefined
    this.setupCallbacks({
      ask: (data) => data.set(seed),
      err: (message) => (error = new WasmWalletError(message))
    })
    this.exports.init(testnet)
    this.resetCallbacks()
    if (error) throw error
  }

  protected getIdentifier() {
    const ret = new Uint8Array(20) // 20 — hash160 result
    let error: WasmWalletError | undefined
    this.setupCallbacks({
      ret: (data) => ret.set(data),
      err: (message) => (error = new WasmWalletError(message))
    })
    this.exports.getIdentifier()
    this.resetCallbacks()
    if (error) throw error
    return ret
  }
}
