export default class Amount {
  constructor(readonly satoshi: bigint) {}

  static fromBtc(value: string | number) {
    const splited = String(value).split('.')
    if (splited[1]) {
      splited[1] = `${splited[1]}${'0'.repeat(8 - splited[1].length)}`
    }
    return new Amount(BigInt(splited[0]) * 100000000n + BigInt(splited[1] ?? 0))
  }

  get btc() {
    let s = String(this.satoshi)
    if (s.length < 8) {
      const len = s.length
      while (s.endsWith('0') && s.length > 0) {
        s = s.slice(0, -1)
      }
      return `0.${'0'.repeat(8 - len)}${s}`
    }
    if (s.length === 8) return `0.${s}`
    const intPartEnd = s.length - 8
    return `${s.slice(0, intPartEnd)}.${s.slice(intPartEnd)}`
  }

  add(other: Amount | bigint) {
    const satoshi = other instanceof Amount ? other.satoshi : other
    return new Amount(this.satoshi + satoshi)
  }

  sub(other: Amount | bigint) {
    const satoshi = other instanceof Amount ? other.satoshi : other
    return new Amount(this.satoshi - satoshi)
  }

  mul(other: Amount | bigint) {
    const satoshi = other instanceof Amount ? other.satoshi : other
    return new Amount(this.satoshi * satoshi)
  }

  eq(other: Amount | bigint) {
    const satoshi = other instanceof Amount ? other.satoshi : other
    return this.satoshi === satoshi
  }

  ne(other: Amount | bigint) {
    return !this.eq(other)
  }

  gt(other: Amount | bigint) {
    const satoshi = other instanceof Amount ? other.satoshi : other
    return this.satoshi > satoshi
  }

  ge(other: Amount | bigint) {
    return this.eq(other) || this.gt(other)
  }

  lt(other: Amount | bigint) {
    const satoshi = other instanceof Amount ? other.satoshi : other
    return this.satoshi < satoshi
  }

  le(other: Amount | bigint) {
    return this.eq(other) || this.lt(other)
  }
}
