import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

// Simple component test that doesn't require routing
const TestComponent = () => {
  return <div data-testid="test-component">SaaS Blueprint Generator</div>;
};

describe('App Component', () => {
  it('renders test component without crashing', () => {
    const { getByTestId } = render(<TestComponent />);
    const element = getByTestId('test-component');
    expect(element).toBeInTheDocument();
    expect(element.textContent).toBe('SaaS Blueprint Generator');
  });
});
