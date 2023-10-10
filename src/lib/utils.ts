import {
  applyTheme,
  argbFromHex,
  hexFromArgb,
  type Theme,
  themeFromSourceColor
} from '@material/material-color-utilities'

export function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2)
  }).join('')
}

export function hexToBytes(hex: string) {
  const ret = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    ret[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return ret
}

export function intToBytes(value: number | bigint, size: number) {
  const binary = value.toString(2)
  const paddedBinary = binary.padStart(Math.ceil(binary.length / 8) * 8, '0')
  const bytes = paddedBinary.match(/.{1,8}/g) as RegExpMatchArray // cant be null
  const decimalBytes = bytes.map((byte) => parseInt(byte, 2))
  if (decimalBytes.length === size) return new Uint8Array(decimalBytes)
  const zeros = []
  for (let i = 0; i < size - decimalBytes.length; i++) zeros.push(0)
  return new Uint8Array([...zeros, ...decimalBytes])
}

export function getEsploraBasePath(net: 'main' | 'test') {
  return net === 'main'
    ? 'https://blockstream.info/api'
    : 'https://blockstream.info/testnet/api'
}

export function setTheme(): Theme {
  const defaultPrimary = Telegram.WebApp.colorScheme === 'light' ? '#6750A4' : '#D0BCFF'
  const theme = themeFromSourceColor(
    argbFromHex(Telegram?.WebApp.themeParams.button_color ?? defaultPrimary),
    [{ value: argbFromHex('#008000'), name: 'green', blend: true }]
  )
  let surfaceContainer: number
  let surfaceContainerHighest: number
  if (Telegram.WebApp.colorScheme === 'light') {
    surfaceContainer = theme.palettes.neutral.tone(94)
    surfaceContainerHighest = theme.palettes.neutral.tone(90)
  } else {
    surfaceContainer = theme.palettes.neutral.tone(12)
    surfaceContainerHighest = theme.palettes.neutral.tone(22)
  }

  applyTheme(theme, { dark: Telegram.WebApp.colorScheme === 'dark' })
  document.body.style.setProperty(
    '--md-sys-color-surface-container',
    hexFromArgb(surfaceContainer)
  )
  document.body.style.setProperty(
    '--md-sys-color-surface-container-highest',
    hexFromArgb(surfaceContainerHighest)
  )
  theme.customColors.forEach((color) => {
    const group = color[Telegram.WebApp.colorScheme]
    const prefix = '--md-custom-color'
    document.body.style.setProperty(
      `${prefix}-${color.color.name}`,
      hexFromArgb(group.color)
    )
    document.body.style.setProperty(
      `${prefix}-${color.color.name}-container`,
      hexFromArgb(group.colorContainer)
    )
    document.body.style.setProperty(
      `${prefix}-on-${color.color.name}`,
      hexFromArgb(group.onColor)
    )
    document.body.style.setProperty(
      `${prefix}-on-${color.color.name}-container`,
      hexFromArgb(group.onColorContainer)
    )
  })
  Telegram.WebApp.MainButton.setParams({
    color: hexFromArgb(theme.schemes[Telegram.WebApp.colorScheme].primaryContainer),
    text_color: hexFromArgb(theme.schemes[Telegram.WebApp.colorScheme].onPrimaryContainer)
  })

  return theme
}
