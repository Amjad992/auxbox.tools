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
 *
 * Polymorphic anchor support (MIN-4):
 *   Pass `href` (or `as="a"`) to render a styled anchor that shares all
 *   button variants. Anchors don't receive a `type` attribute.
 *
 *   <Button variant="success" href={url} download={filename}>Download</Button>
 */
export default function Button({
  as,
  href,
  variant = 'primary',
  block = false,
  className,
  children,
  type = 'button',
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

  // Render an <a> when href is provided or `as="a"` is requested.
  const isAnchor = as === 'a' || href !== undefined;
  if (isAnchor) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}

Button.propTypes = {
  as: PropTypes.string,
  href: PropTypes.string,
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
