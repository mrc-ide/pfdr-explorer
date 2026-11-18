import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl.tsx';

describe('SegmentedControl', () => {
  const options = [
    { value: 'median', label: 'Median' },
    { value: 'mean', label: 'Mean' },
    { value: 'sd', label: 'SD' },
  ];

  const Controlled = ({ initial }: { initial: string }) => {
    const [value, setValue] = useState(initial);
    return <SegmentedControl label="Statistic" options={options} value={value} onChange={setValue} />;
  };

  it('is a radio group named by its label', () => {
    render(<Controlled initial="median" />);
    expect(screen.getByRole('radiogroup', { name: 'Statistic' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Median' })).toBeChecked();
  });

  it('is one Tab stop: only the selected option can be tabbed to', async () => {
    const user = userEvent.setup();
    render(<Controlled initial="mean" />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Mean' })).toHaveFocus();
  });

  it('moves and selects with the arrow keys, wrapping round, and Home and End', async () => {
    const user = userEvent.setup();
    render(<Controlled initial="median" />);
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'SD' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'SD' })).toBeChecked();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Median' })).toBeChecked();
    await user.keyboard('{End}');
    expect(screen.getByRole('radio', { name: 'SD' })).toBeChecked();
    await user.keyboard('{Home}');
    expect(screen.getByRole('radio', { name: 'Median' })).toBeChecked();
    await user.keyboard('{ArrowRight}{ArrowUp}');
    expect(screen.getByRole('radio', { name: 'Median' })).toHaveFocus();
  });

  it('ignores other keys', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SegmentedControl label="Statistic" options={options} value="median" onChange={onChange} />);
    await user.tab();
    await user.keyboard('a');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selects by click', async () => {
    render(<Controlled initial="median" />);
    await userEvent.click(screen.getByRole('radio', { name: 'SD' }));
    expect(screen.getByRole('radio', { name: 'SD' })).toBeChecked();
  });

  it('can still be reached by Tab when the value matches no option', async () => {
    const user = userEvent.setup();
    render(<SegmentedControl label="Statistic" options={options} value="exceedance" onChange={() => {}} />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Median' })).toHaveFocus();
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
  });
});
