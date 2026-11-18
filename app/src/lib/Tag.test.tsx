import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tag } from './Tag.tsx';

describe('Tag', () => {
  it('is a plain span holding its text, not a control', () => {
    render(<Tag tone="warning">Warning</Tag>);
    expect(screen.getByText('Warning').tagName).toBe('SPAN');
  });
});
