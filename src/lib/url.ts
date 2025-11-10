/**
 * URL helper utilities for managing search params
 */

/**
 * Set or remove a URL parameter
 * @param url - The URL object to modify
 * @param key - The parameter key
 * @param val - The parameter value (null/undefined removes it)
 */
export function setParam(url: URL, key: string, val?: string | null): void {
  if (val === null || val === undefined || val === '') {
    url.searchParams.delete(key)
  } else {
    url.searchParams.set(key, val)
  }
}

/**
 * Parse a boolean parameter from URLSearchParams
 * @param sp - URLSearchParams object
 * @param key - The parameter key to parse
 * @returns true if the param is '1', false otherwise
 */
export function parseBoolParam(sp: URLSearchParams, key: string): boolean {
  return sp.get(key) === '1'
}

/**
 * Build a query string from an object, omitting empty values
 * @param params - Object with string values
 * @returns Query string without leading '?'
 */
export function buildQueryString(params: Record<string, string | undefined | null>): string {
  const url = new URL('http://dummy.com')

  Object.entries(params).forEach(([key, value]) => {
    setParam(url, key, value)
  })

  return url.searchParams.toString()
}
