import PropTypes from 'prop-types';
import {useMemo} from 'react';
import {buildPalette, slicePath} from '../utils';
import {
  SPIN_DURATION_MS,
  SPIN_EASING,
  MAX_ENTRIES_FULL_LABELS,
} from '../constants';

const VIEW = 320;
const CENTER = VIEW / 2;
const RADIUS = VIEW / 2 - 4;
const LABEL_RADIUS = RADIUS * 0.65;

/**
 * SVG wheel-of-fortune. The wheel itself is a single rotating <g> driven by
 * the `rotation` prop applied to a `transform: rotate(...)` style. The
 * pointer is rendered separately, fixed at the top.
 *
 * `isSpinning` toggles the CSS transition; while false, rotation jumps
 * instantly (e.g. when resetting between spins).
 */
export default function SpinWheel({
  entries,
  rotation,
  isSpinning,
  onTransitionEnd,
}) {
  const n = entries.length;
  const palette = useMemo(() => buildPalette(n), [n]);
  const showLabels = n <= MAX_ENTRIES_FULL_LABELS;

  // Font size shrinks as slices get tighter.
  const fontSize = useMemo(() => {
    if (n <= 6) return 14;
    if (n <= 12) return 12;
    if (n <= 24) return 10;
    return 9;
  }, [n]);

  if (n < 1) {
    return (
      <div className="ws-wheel ws-wheel--empty" aria-hidden="true">
        <p>Add entries to draw the wheel.</p>
      </div>
    );
  }

  // n === 1 still renders a single full-circle slice — used by Pick-multiple
  // mode's "Pick last" step so the wheel doesn't visually disappear.
  const sliceDeg = 360 / n;

  return (
    <div className="ws-wheel">
      <div className="ws-wheel-pointer" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="32" height="32">
          <path d="M12 22 L4 6 L20 6 Z" fill="#ff6b6b" stroke="#1a1a1a" strokeWidth="1.5" />
        </svg>
      </div>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="ws-wheel-svg"
        role="img"
        aria-label={`Spin wheel with ${n} entries`}
      >
        <g
          className="ws-wheel-rotor"
          style={{
            transformOrigin: `${CENTER}px ${CENTER}px`,
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? `transform ${SPIN_DURATION_MS}ms ${SPIN_EASING}`
              : 'none',
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {entries.map((entry, i) => {
            const start = i * sliceDeg;
            const end = (i + 1) * sliceDeg;
            const d = slicePath(CENTER, CENTER, RADIUS, start, end);
            // Label position at slice centre: angle measured clockwise from
            // top, then converted to SVG (y-down) coordinates.
            const labelAngle = (i + 0.5) * sliceDeg;
            const a = ((labelAngle - 90) * Math.PI) / 180;
            const lx = CENTER + LABEL_RADIUS * Math.cos(a);
            const ly = CENTER + LABEL_RADIUS * Math.sin(a);
            // Rotate the text along the radial line so it reads outward.
            const textRotate = labelAngle;
            return (
              <g key={`${i}:${entry}`}>
                <path
                  d={d}
                  fill={palette[i]}
                  stroke="#1a1a1a"
                  strokeWidth="1"
                />
                {showLabels && (
                  <text
                    x={lx}
                    y={ly}
                    fontSize={fontSize}
                    fill="#ffffff"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${textRotate} ${lx} ${ly})`}
                    style={{pointerEvents: 'none', userSelect: 'none'}}
                  >
                    {truncate(entry, n)}
                  </text>
                )}
              </g>
            );
          })}
          {/* Hub */}
          <circle cx={CENTER} cy={CENTER} r={Math.max(8, RADIUS * 0.06)} fill="#1a1a1a" stroke="#ff6b6b" strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
}

function truncate(s, n) {
  // Tighter slices fit fewer characters.
  const max = n <= 6 ? 18 : n <= 12 ? 14 : n <= 24 ? 10 : 7;
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(1, max - 1))}…`;
}

SpinWheel.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.string).isRequired,
  rotation: PropTypes.number.isRequired,
  isSpinning: PropTypes.bool,
  onTransitionEnd: PropTypes.func,
};
