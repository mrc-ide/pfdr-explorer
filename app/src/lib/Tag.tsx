import type { ReactNode } from 'react';
import './charm/defaults.css';
import './charm/constants.css';
import styles from './Tag.module.css';

export interface TagProps {
  tone?: 'neutral' | 'accent' | 'warning' | 'illustrative';
  dot?: boolean;
  size?: 'medium' | 'large';
  children: ReactNode;
}

export const Tag = ({ tone = 'neutral', dot = false, size = 'medium', children }: TagProps) => (
  <span className={`${styles.tag} ${styles[tone]} ${styles[size]}`}>
    {dot && <span className={styles.dot} aria-hidden="true" />}
    {children}
  </span>
);
