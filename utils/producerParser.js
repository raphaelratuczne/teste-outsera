export function parseProducers(producersString) {
  if (
    !producersString ||
    typeof producersString !== 'string' ||
    producersString.trim() === ''
  ) {
    return [];
  }
  const names = producersString
    .replace(/,\s*and\s+/gi, ',') // "A, and B" -> "A,B"
    .replace(/\s+and\s+/gi, ',') // "A and B"  -> "A,B"
    .split(',');

  return names.map((name) => name.trim()).filter((name) => name.length > 0);
}
