import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Extend global types
declare global {
  interface Window {
    ResizeObserver: unknown;
    IntersectionObserver: unknown;
  }
}

// Mock canvas context for Lottie and other canvas-based components
class MockCanvasRenderingContext2D {
  fillStyle = '';
  font = '';
  clearRect = vi.fn();
  fillText = vi.fn();
  getImageData = vi.fn(() => ({
    data: new Uint8ClampedArray(800 * 800 * 4),
  }));
  beginPath = vi.fn();
  rect = vi.fn();
  stroke = vi.fn();
}

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => new MockCanvasRenderingContext2D()),
});

// Mock Lottie animations
vi.mock('lottie-react', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({
    animationData,
    ...props
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    animationData: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }) =>
    React.createElement(
      'div',
      { 'data-testid': 'lottie-animation', ...props },
      'Lottie Animation'
    ),
}));

// Mock ResizeObserver
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
