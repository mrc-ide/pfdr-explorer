import { useId, useRef, type KeyboardEvent } from 'react';
import './charm/defaults.css';
import './charm/constants.css';
import styles from './SegmentedControl.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'medium' | 'large';
}

const TAB_STOP = 0;
const SKIPPED_BY_TAB = -1;
const NOT_FOUND = -1;
const FIRST_OPTION = 0;

const moves: Partial<Record<string, (index: number, count: number) => number>> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowDown: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  ArrowUp: (index, count) => (index - 1 + count) % count,
  Home: () => FIRST_OPTION,
  End: (_index, count) => count - 1,
};

export const SegmentedControl = <T extends string>({ label, options, value, onChange, size = 'medium' }: SegmentedControlProps<T>) => {
  const labelId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = options.findIndex(option => option.value === value);
  const reachable = selected === NOT_FOUND ? FIRST_OPTION : selected;

  const onKeyDown = (event: KeyboardEvent) => {
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const next = move(reachable, options.length);
    onChange(options[next].value);
    buttons.current[next]?.focus();
  };

  return (
    <div className={`${styles.field} ${styles[size]}`}>
      <span id={labelId} className={styles.label}>{label}</span>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.group} onKeyDown={onKeyDown}>
        {options.map((option, index) => (
          <button
            key={option.value}
            ref={element => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={index === selected}
            tabIndex={index === reachable ? TAB_STOP : SKIPPED_BY_TAB}
            className={styles.option}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
