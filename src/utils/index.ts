export function truncateDecimalPlaces(n: number, decimalPlaces: number) {
  const pow = Math.pow(10, decimalPlaces)
  const number = Math.trunc(n * pow) / pow

  return number
}

export function getSetFromObjectAttributes<T, K extends keyof T>(
  input: T[] | Map<string, T>,
  attribute: K
) {
  const set = new Set<T[K]>()

  if (Array.isArray(input)) {
    input.forEach(element => set.add(element[attribute]))
  } else {
    Object.values(input).forEach(element => set.add(element[attribute]))
  }

  return set
}
