import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select.tsx';

describe('Select', () => {
  const groups = [
    { label: 'k13', options: [{ value: 'k13:combined', label: 'k13 combined' }, { value: 'k13:561H', label: 'k13 561H' }] },
    { label: 'crt', options: [{ value: 'crt:76T', label: 'crt 76T', disabled: true, note: 'Not enough data for a meaningful model' }] },
  ];

  it('is a combobox named by its visible label', () => {
    render(<Select label="Marker" value="k13:561H" onChange={() => {}} options={groups} />);
    expect(screen.getByRole('combobox', { name: 'Marker' })).toHaveValue('k13:561H');
  });

  it('groups options and explains why one is unavailable', () => {
    render(<Select label="Marker" value="k13:combined" onChange={() => {}} options={groups} />);
    expect(screen.getByRole('group', { name: 'crt' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'crt 76T (Not enough data for a meaningful model)' })).toBeDisabled();
  });

  it('reports the chosen value', async () => {
    const onChange = vi.fn();
    render(<Select label="Marker" value="k13:combined" onChange={onChange} options={groups} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'k13:561H');
    expect(onChange).toHaveBeenCalledWith('k13:561H');
  });

  it('takes plain options as well as groups, and keeps an id passed in', () => {
    render(<Select id="country" label="Country" value="UGA" onChange={() => {}} options={[{ value: 'UGA', label: 'Uganda' }]} />);
    expect(screen.getByRole('combobox', { name: 'Country' })).toHaveAttribute('id', 'country');
  });
});
