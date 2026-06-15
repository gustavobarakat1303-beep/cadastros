// Gera um código curto, legível e único o suficiente para cupons.
// Evita caracteres ambíguos (0/O, 1/I) para facilitar a digitação manual.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCode(length = 6, prefix = '') {
  let out = ''
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  for (let i = 0; i < length; i++) {
    out += ALPHABET[values[i] % ALPHABET.length]
  }
  return prefix ? `${prefix}-${out}` : out
}
