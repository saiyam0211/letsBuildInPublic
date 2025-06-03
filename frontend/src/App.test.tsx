import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders the main heading', () => {
    render(<App />);
    const heading = screen.getByText(/SaaS Blueprint Generator Platform/i);
    expect(heading).toBeInTheDocument();
  });

  it('displays Phase 1.1 completion status', () => {
    render(<App />);
    const phaseStatus = screen.getByText(/Phase 1.1 Complete/i);
    expect(phaseStatus).toBeInTheDocument();
  });

  it('shows tech stack information', () => {
    render(<App />);
    const techStackHeading = screen.getByText(/Tech Stack/i);
    expect(techStackHeading).toBeInTheDocument();
  });

  it('displays development status', () => {
    render(<App />);
    const statusHeading = screen.getByText(/Development Status/i);
    expect(statusHeading).toBeInTheDocument();
  });
});
