import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Switch } from './Switch.tsx';

describe('Switch', () => {
  const ControlledSwitch = () => {
    const [checked, setChecked] = useState(true);
    return <Switch label="Survey points" checked={checked} onChange={setChecked} />;
  };

  it('is a switch named by its label, with its state exposed', () => {
    render(<ControlledSwitch />);
    expect(screen.getByRole('switch', { name: 'Survey points' })).toBeChecked();
    expect(screen.getByText('On')).toBeInTheDocument();
  });

  it('toggles by click and by keyboard', async () => {
    const user = userEvent.setup();
    render(<ControlledSwitch />);
    const toggle = screen.getByRole('switch', { name: 'Survey points' });
    await user.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(screen.getByText('Off')).toBeInTheDocument();
    await user.keyboard(' ');
    expect(toggle).toBeChecked();
  });

  it('takes its On and Off words as props, for other languages', () => {
    render(<Switch label="Points d'enquête" checked={false} onChange={() => {}} stateLabels={{ on: 'Activé', off: 'Désactivé' }} />);
    expect(screen.getByText('Désactivé')).toBeInTheDocument();
  });
});
