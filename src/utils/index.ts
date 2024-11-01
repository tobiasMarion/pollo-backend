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

export function getIndexOfClosestValue(array: number[], target: number) {
  if (array.length === 0) {
    return undefined
  }

  let left = 0
  let right = array.length - 1

  while (left < right) {
    const mid = Math.floor((left + right) / 2)

    if (array[mid] === target) return mid

    if (array[mid] < target) {
      left = mid + 1
    } else {
      right = mid
    }
  }

  if (left === 0) return left
  if (left === array.length) return left - 1

  const isLeftCloser =
    Math.abs(array[left] - target) < Math.abs(array[left - 1] - target)

  return isLeftCloser ? left : left - 1
}
