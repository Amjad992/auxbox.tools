'use client';
import PropTypes from 'prop-types';
import Script from 'next/script';
import ErrorBoundary from './ErrorBoundary';
import Hero from './Hero';

/**
 * Standard wrapper for every tool page.
 * Handles: dark gradient page shell, container, hero, optional LD+JSON
 * schema script, and an ErrorBoundary so the whole tool degrades gracefully.
 *
 * Pages should render their interactive content as children. Toasts are
 * rendered separately by the consumer (since they live alongside state).
 */
export default function ToolPage({
  title,
  tagline,
  schema,
  schemaId,
  narrow,
  errorMessage,
  className,
  children,
}) {
  const containerClass = ['container', narrow && 'container--narrow']
    .filter(Boolean)
    .join(' ');

  const pageClass = ['tool-page', className].filter(Boolean).join(' ');

  return (
    <>
      {schema && (
        <Script
          id={schemaId || 'tool-schema'}
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}}
        />
      )}
      <main className={pageClass}>
        <ErrorBoundary message={errorMessage}>
          <div className={containerClass}>
            <Hero title={title} tagline={tagline} />
            {children}
          </div>
        </ErrorBoundary>
      </main>
    </>
  );
}

ToolPage.propTypes = {
  title: PropTypes.string.isRequired,
  tagline: PropTypes.node,
  schema: PropTypes.object,
  schemaId: PropTypes.string,
  narrow: PropTypes.bool,
  errorMessage: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
