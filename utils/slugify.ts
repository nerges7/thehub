export function generateKeyFromText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // quita acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
