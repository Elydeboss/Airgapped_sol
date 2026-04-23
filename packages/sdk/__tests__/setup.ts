import { vi } from 'vitest'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Suppress console.log in tests unless debugging
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
}

// Mock Web Crypto API for Node environment
if (!global.crypto) {
  global.crypto = {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    subtle: {} as any,
  } as Crypto
}
