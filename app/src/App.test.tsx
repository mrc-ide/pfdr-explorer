import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('shows the app name as the main heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'PfDR Explorer' })).toBeInTheDocument();
  });
});
