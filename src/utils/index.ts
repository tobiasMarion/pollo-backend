export function truncateDecimalPlaces(n: number, decimalPlaces: number) {
  const pow = Math.pow(10, decimalPlaces)
  const number = Math.trunc(n * pow) / pow

  return number
}

export function getSortedUniqueAttributes<T, K extends keyof T>(
  input: T[] | Map<string, T>,
  attribute: K
): T[K][] {
  const uniqueValues = new Set<T[K]>()

  input.forEach(element => uniqueValues.add(element[attribute]))

  return Array.from(uniqueValues).sort()
}
