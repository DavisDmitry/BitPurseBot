import { bech32 } from 'bech32'

import { InvalidAddressError } from './errors'

const NATIVE_SEGWIT_ADDRESS_LEN = 42

export function encode(pubkeyhash: Uint8Array, net: 'main' | 'test') {
  const prefix = net === 'main' ? 'bc' : 'tb'
  return bech32.encode(prefix, [
    0, // witness version
    ...bech32.toWords(pubkeyhash)
  ])
}

export function decode(address: string, net: 'main' | 'test') {
  const prefix = net === 'main' ? 'bc1q' : 'tb1q'
  address = address.toLowerCase()
  if (!address.startsWith(prefix))
    throw new InvalidAddressError('Unsupported address prefix.')
  if (address.length !== NATIVE_SEGWIT_ADDRESS_LEN)
    throw new InvalidAddressError('Invalid address length.')
  try {
    return Uint8Array.from(bech32.fromWords(bech32.decode(address).words.slice(1)))
  } catch (err) {
    if (err instanceof Error)
      throw new InvalidAddressError(err.message, { cause: err.cause })
    throw new Error(String(err), { cause: err })
  }
}
