import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button.tsx';
import { Panel } from './Panel.tsx';
import { SegmentedControl } from './SegmentedControl.tsx';
import { Select } from './Select.tsx';
import { Switch } from './Switch.tsx';
import { Tag } from './Tag.tsx';

const NESTED_LEVEL = 3;

describe('Button', () => {
  it('is a plain button by default, so it never submits a form by accident', () => {
    render(<Button>Download</Button>);
    expect(screen.getByRole('button', { name: 'Download' })).toHaveAttribute('type', 'button');
  });

  it('calls onClick, and not when disabled', async () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Download</Button>);
    await userEvent.click(screen.getByRole('button'));
    rerender(<Button onClick={onClick} disabled>Download</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps a class passed in alongside its own', () => {
    render(<Button variant="secondary" size="small" className="extra">Reset</Button>);
    expect(screen.getByRole('button')).toHaveClass('extra');
  });
});

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
