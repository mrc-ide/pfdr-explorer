import type { ComponentPropsWithRef } from 'react';
import './charm/defaults.css';
import './charm/constants.css';
import styles from './Button.module.css';
import sizes from './sizes.module.css'
import type { Size } from './sizes';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: Size;
}

export const Button = ({ variant = 'primary', size = 'medium', type = 'button', className, ...rest }: ButtonProps) => (
  <button
    type={type}
    className={[styles.button, styles[variant], sizes[size], className].filter(Boolean).join(' ')}
    {...rest}
  />
);
