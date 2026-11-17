import './charm/defaults.css';
import './charm/constants.css';
import styles from './Switch.module.css';
import sizes from './sizes.module.css'
import type { Size } from './sizes';

export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  stateLabels?: { on: string; off: string };
  size?: Size;
}

export const Switch = ({ label, checked, onChange, stateLabels = { on: 'On', off: 'Off' }, size = 'medium' }: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    className={`${styles.switch} ${sizes[size]}`}
    onClick={() => onChange(!checked)}
  >
    <span className={styles.track} aria-hidden="true">
      <span className={styles.knob} />
    </span>
    <span>{label}</span>
    <span className={styles.state} aria-hidden="true">{checked ? stateLabels.on : stateLabels.off}</span>
  </button>
);
