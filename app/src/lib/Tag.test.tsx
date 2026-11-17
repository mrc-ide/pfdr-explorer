import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tag } from './Tag.tsx';

describe('Tag', () => {
  it('shows its text, with an optional decorative dot', () => {
    const { container } = render(<Tag tone="warning" dot>Above 5%</Tag>);
    expect(screen.getByText('Above 5%')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('defaults to the neutral tone with no dot', () => {
    const { container } = render(<Tag>Illustrative data</Tag>);
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });
});
