import { useId, type ReactNode } from 'react';
import './charm/defaults.css';
import './charm/constants.css';
import styles from './Panel.module.css';

export type HeadingLevel = 2 | 3 | 4;

const PAGE_SECTION_LEVEL: HeadingLevel = 2;

export interface PanelProps {
  title?: string;
  eyebrow?: string;
  headingLevel?: HeadingLevel;
  actions?: ReactNode;
  flush?: boolean;
  size?: 'small' | 'medium' | 'large';
  children: ReactNode;
}

export const Panel = ({ title, eyebrow, headingLevel = PAGE_SECTION_LEVEL, actions, flush = false, size = 'medium', children }: PanelProps) => {
  const titleId = useId();
  const Heading = `h${headingLevel}` as const;

  return (
    <section className={`${styles.panel} ${styles[size]}`} aria-labelledby={title ? titleId : undefined}>
      {(title || eyebrow || actions) && (
        <header className={styles.head}>
          <div className={styles.titles}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            {title && <Heading id={titleId} className={styles.title}>{title}</Heading>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      <div className={flush ? undefined : styles.body}>{children}</div>
    </section>
  );
};
