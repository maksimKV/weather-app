import { render } from '@testing-library/svelte';
import type { ComponentType } from 'svelte';

export function renderComponent<T extends ComponentType>(
  component: T,
  props: Record<string, unknown> = {}
) {
  return render(component, { props });
}

export function createMockEvent(type: string, detail?: unknown) {
  return new CustomEvent(type, { detail });
}

export function waitForTimeout(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function mockWindowSize(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
}
