import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Panel } from './Panel.tsx';

const NESTED_LEVEL = 3;

describe('Panel', () => {
  it('is a region named by its title, at the heading level asked for', () => {
    render(<Panel title="Uganda" eyebrow="Country" headingLevel={NESTED_LEVEL}>Body</Panel>);
    expect(screen.getByRole('region', { name: 'Uganda' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: NESTED_LEVEL, name: 'Uganda' })).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('shows actions, and has no header or name without a title', () => {
    const { rerender } = render(<Panel actions={<button type="button">Close</button>}>Body</Panel>);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    rerender(<Panel flush>Body</Panel>);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
