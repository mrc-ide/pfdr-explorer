import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select.tsx';

describe('Select', () => {
  const groups = [
    { label: 'Group 1', options: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }] },
    { label: 'Group 2', options: [{ value: 'c', label: 'Option C', disabled: true, note: 'Not available' }] },
  ];

  it('is a combobox named by its visible label', () => {
    render(<Select label="Choice" value="b" onChange={() => {}} options={groups} />);
    expect(screen.getByRole('combobox', { name: 'Choice' })).toHaveValue('b');
  });

  it('groups options and explains why one is unavailable', () => {
    render(<Select label="Choice" value="a" onChange={() => {}} options={groups} />);
    expect(screen.getByRole('group', { name: 'Group 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option C (Not available)' })).toBeDisabled();
  });

  it('reports the chosen value', async () => {
    const onChange = vi.fn();
    render(<Select label="Choice" value="a" onChange={onChange} options={groups} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'b');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('takes plain options as well as groups, and keeps an id passed in', () => {
    render(<Select id="country" label="Country" value="UGA" onChange={() => {}} options={[{ value: 'UGA', label: 'Uganda' }]} />);
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveAttribute('id', 'country');
  });
});
