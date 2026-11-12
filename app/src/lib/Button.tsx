import type { ComponentPropsWithRef } from 'react';
import './charm/defaults.css';
import './charm/constants.css';
import styles from './Button.module.css';

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export const Button = ({ variant = 'primary', size = 'medium', type = 'button', className, ...rest }: ButtonProps) => (
  <button
    type={type}
    className={[styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ')}
    {...rest}
  />
);
