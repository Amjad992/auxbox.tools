import PropTypes from 'prop-types';

/**
 * Generic surface used by every tool — dark card with border + radius.
 * Use `inset` for nested cards on a card (slightly darker bg).
 */
export default function Card({inset, className, children, as, ...rest}) {
  const Tag = as || 'section';
  const classes = [
    'tool-card',
    inset && 'tool-card--inset',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}

Card.propTypes = {
  inset: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  as: PropTypes.string,
};
