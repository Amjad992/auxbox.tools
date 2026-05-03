import PropTypes from 'prop-types';

/**
 * Tool page hero — centered title and tagline with the brand glow.
 * Use this on every tool page; do not re-implement.
 */
export default function Hero({title, tagline}) {
  return (
    <section className="tool-hero">
      <h1>{title}</h1>
      {tagline && <p className="tool-tagline">{tagline}</p>}
    </section>
  );
}

Hero.propTypes = {
  title: PropTypes.string.isRequired,
  tagline: PropTypes.node,
};
