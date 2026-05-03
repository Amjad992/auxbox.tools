import PropTypes from 'prop-types';

/**
 * The single Button component for every tool. Use the `variant` prop instead
 * of writing new button CSS — extend the variants in src/styles/tools.css if
 * a new color is genuinely needed.
 *
 * Variants:
 *   - primary  (red/brand)   — main CTAs (e.g. Generate)
 *   - success  (green)       — Save / Download
 *   - danger   (red)         — Remove / Delete
 *   - warning  (orange)      — Reset
 *   - info     (blue)        — Add
 *   - neutral  (grey)        — Clear saved
 */
export default function Button({
  variant,
  block,
  className,
  children,
  type,
  ...rest
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    block && 'btn-block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf([
    'primary',
    'success',
    'danger',
    'warning',
    'info',
    'neutral',
  ]),
  block: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  type: PropTypes.string,
};

Button.defaultProps = {
  variant: 'primary',
  block: false,
  type: 'button',
};
