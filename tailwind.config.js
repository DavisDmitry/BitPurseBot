const sysColors = [
  'primary',
  'primary-container',
  'on-primary',
  'on-primary-container',
  'secondary',
  'secondary-container',
  'on-secondary',
  'on-secondary-container',
  'surface',
  'surface-container',
  'surface-container-highest',
  'surface-variant',
  'on-surface',
  'on-surface-variant',
  'background',
  'on-background',
  'error',
  'error-container',
  'on-error',
  'on-error-container',
  'outline',
  'outline-variant'
]
const customColors = ['green', 'on-green', 'green-container', 'on-green-container']
const colors = {}
sysColors.forEach((color) => (colors[color] = `var(--md-sys-color-${color})`))
customColors.forEach((color) => (colors[color] = `var(--md-custom-color-${color})`))

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    colors,
    extend: {
      gridTemplateRows: {
        12: 'repeat(12, minmax(0, 1fr))'
      }
    }
  },
  plugins: []
}
