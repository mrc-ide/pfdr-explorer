import { useState } from 'react';
import { Button } from '../lib/Button.tsx';
import { Panel, type HeadingLevel } from '../lib/Panel.tsx';
import { SegmentedControl } from '../lib/SegmentedControl.tsx';
import { Select } from '../lib/Select.tsx';
import { Switch } from '../lib/Switch.tsx';
import { Tag } from '../lib/Tag.tsx';
import styles from './Showcase.module.css';

type Statistic = 'median' | 'mean' | 'interval' | 'sd';
type View = Statistic | 'exceedance';

const STATISTICS: readonly { value: Statistic; label: string }[] = [
  { value: 'median', label: 'Median' },
  { value: 'mean', label: 'Mean' },
  { value: 'interval', label: '95% interval' },
  { value: 'sd', label: 'SD' },
];

const MARKERS = [
  {
    label: 'k13',
    options: [
      { value: 'k13:675:V', label: 'k13 675V' },
      { value: 'k13:441:L', label: 'k13 441L' },
    ],
  },
  { label: 'crt', options: [{ value: 'crt:76:T', label: 'crt 76T' }] },
];

const THREE_SIZES = ['small', 'medium', 'large'] as const;
const TWO_SIZES = ['medium', 'large'] as const;
const TONES = ['neutral', 'accent', 'warning', 'illustrative'] as const;
const NESTED_HEADING: HeadingLevel = 3;

export const Showcase = () => {
  const [marker, setMarker] = useState('k13:675:V');
  const [statistic, setStatistic] = useState<Statistic>('median');
  const [view, setView] = useState<View>('exceedance');
  const [surveys, setSurveys] = useState(true);
  const [borders, setBorders] = useState(false);
  const [presses, setPresses] = useState(0);

  return (
    <main className={styles.page}>
      <section className={styles.stack}>
        <h1>CHARM components</h1>
        <p className={styles.note}>
          Every component in its variants, sizes and states, for trying by hand. Only <code>npm run dev</code> serves
          this page: it isn't part of the built app.
        </p>
      </section>

      <section className={styles.stack}>
        <h2>Together, as the map options</h2>
        <Panel eyebrow="Options" title="Map options" actions={<Button variant="ghost" size="small">Close</Button>}>
          <div className={styles.stack}>
            <Select label="Marker" value={marker} onChange={setMarker} options={MARKERS} />
            <SegmentedControl label="Statistic" options={STATISTICS} value={statistic} onChange={setStatistic} />
            <Switch label="Survey points" checked={surveys} onChange={setSurveys} />
            <Switch label="Region borders" checked={borders} onChange={setBorders} />
          </div>
        </Panel>
        <p className={styles.note}>
          Marker {marker}, statistic {statistic}, survey points {surveys ? 'on' : 'off'}, borders {borders ? 'on' : 'off'}
        </p>
      </section>

      <section className={styles.stack}>
        <h2>Button</h2>
        {THREE_SIZES.map(size => (
          <div key={size} className={styles.row}>
            <Button size={size} onClick={() => setPresses(count => count + 1)}>Primary, {size}</Button>
            <Button size={size} variant="secondary">Secondary</Button>
            <Button size={size} variant="ghost">Ghost</Button>
            <Button size={size} disabled>Disabled</Button>
          </div>
        ))}
        <p className={styles.note}>Primary buttons pressed: {presses}</p>
      </section>

      <section className={styles.stack}>
        <h2>Switch</h2>
        {THREE_SIZES.map(size => (
          <div key={size} className={styles.row}>
            <Switch size={size} label={`Survey points, ${size}`} checked={surveys} onChange={setSurveys} />
          </div>
        ))}
        <div className={styles.row}>
          <Switch label="Points d'enquête" checked={surveys} onChange={setSurveys} stateLabels={{ on: 'Oui', off: 'Non' }} />
        </div>
      </section>

      <section className={styles.stack}>
        <h2>SegmentedControl</h2>
        {TWO_SIZES.map(size => (
          <SegmentedControl key={size} size={size} label={`Statistic, ${size}`} options={STATISTICS} value={statistic} onChange={setStatistic} />
        ))}
        <SegmentedControl label="Value matching no option (Tab still reaches it)" options={STATISTICS} value={view} onChange={setView} />
      </section>

      <section className={styles.stack}>
        <h2>Select</h2>
        {THREE_SIZES.map(size => (
          <Select key={size} size={size} label={`Marker, ${size}`} value={marker} onChange={setMarker} options={MARKERS} />
        ))}
        <Select label="Disabled" value={marker} onChange={setMarker} options={MARKERS} disabled />
      </section>

      <section className={styles.stack}>
        <h2>Panel</h2>
        {THREE_SIZES.map(size => (
          <Panel key={size} size={size} eyebrow="Country" title={`Uganda, ${size}`} headingLevel={NESTED_HEADING}>
            <p>Body text inside a {size} panel.</p>
          </Panel>
        ))}
        <Panel flush>
          <p>A flush panel: no title, and no padding around its body.</p>
        </Panel>
      </section>

      <section className={styles.stack}>
        <h2>Tag</h2>
        {TWO_SIZES.map(size => (
          <div key={size} className={styles.row}>
            {TONES.map(tone => (
              <Tag key={tone} tone={tone} size={size}>{tone}, {size}</Tag>
            ))}
            <Tag size={size} dot>With a dot</Tag>
          </div>
        ))}
      </section>
    </main>
  );
};
