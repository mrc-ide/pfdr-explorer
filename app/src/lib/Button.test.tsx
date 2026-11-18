import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button.tsx';

describe('Button', () => {
  it('is a plain button by default, so it never submits a form by accident', () => {
    render(<Button>Download</Button>);
    expect(screen.getByRole('button', { name: 'Download' })).toHaveAttribute('type', 'button');
  });

  it('calls onClick, and not when disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Download</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
    rerender(<Button onClick={onClick} disabled>Download</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps a class passed in alongside its own', () => {
    render(<Button variant="secondary" size="small" className="extra">Reset</Button>);
    expect(screen.getByRole('button')).toHaveClass('extra');
  });
});
