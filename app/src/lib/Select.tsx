import { useId, type SelectHTMLAttributes } from 'react';
import './charm/defaults.css';
import './charm/constants.css';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  note?: string;
}

export interface SelectGroup {
  label: string;
  options: readonly SelectOption[];
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'size'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (SelectOption | SelectGroup)[];
  size?: 'small' | 'medium' | 'large';
}

const renderOption = (option: SelectOption) => (
  <option key={option.value} value={option.value} disabled={option.disabled}>
    {option.note ? `${option.label} (${option.note})` : option.label}
  </option>
);

export const Select = ({ label, value, onChange, options, size = 'medium', id, className, ...rest }: SelectProps) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={[styles.field, styles[size], className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={selectId}>{label}</label>
      <div className={styles.control}>
        <select
          id={selectId}
          className={styles.select}
          value={value}
          onChange={event => onChange(event.target.value)}
          {...rest}
        >
          {options.map(item => ('options' in item
            ? <optgroup key={item.label} label={item.label}>{item.options.map(renderOption)}</optgroup>
            : renderOption(item)))}
        </select>
      </div>
    </div>
  );
};
