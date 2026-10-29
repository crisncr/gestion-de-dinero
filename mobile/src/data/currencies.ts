export const currencies = [
  { code: 'CLP', country: 'Chile', symbol: '$', locale: 'es-CL', decimals: 0 },
  { code: 'ARS', country: 'Argentina', symbol: '$', locale: 'es-AR', decimals: 0 },
  { code: 'PEN', country: 'Perú', symbol: 'S/', locale: 'es-PE', decimals: 2 },
  { code: 'BOB', country: 'Bolivia', symbol: 'Bs', locale: 'es-BO', decimals: 2 },
  { code: 'PYG', country: 'Paraguay', symbol: 'Gs', locale: 'es-PY', decimals: 0 },
  { code: 'UYU', country: 'Uruguay', symbol: '$', locale: 'es-UY', decimals: 2 },
  { code: 'COP', country: 'Colombia', symbol: '$', locale: 'es-CO', decimals: 0 },
  { code: 'MXN', country: 'México', symbol: '$', locale: 'es-MX', decimals: 2 },
  { code: 'BRL', country: 'Brasil', symbol: 'R$', locale: 'pt-BR', decimals: 2 },
  { code: 'USD', country: 'Estados Unidos', symbol: 'US$', locale: 'en-US', decimals: 2 },
  { code: 'EUR', country: 'Europa', symbol: '€', locale: 'es-ES', decimals: 2 },
] as const

export type CurrencyCode = (typeof currencies)[number]['code']

export function getCurrency(code: string) {
  return currencies.find((item) => item.code === code) ?? currencies[0]
}

export function isCurrency(code: string): code is CurrencyCode {
  return currencies.some((item) => item.code === code)
}

export function currencyCaption(code: string) {
  const item = getCurrency(code)
  return `${item.country} · ${item.code}`
}
