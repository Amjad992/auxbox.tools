import PropTypes from 'prop-types';
import {MIN_ENTRIES, MAX_ENTRIES_SOFT_CAP} from '../constants';

/**
 * List editor: textarea (one entry per line) + a live count badge and a
 * helpful hint when the list is too short.
 */
export default function ListEditor({text, onChange, parsedCount}) {
  const tooFew = parsedCount < MIN_ENTRIES;
  const tooMany = parsedCount > MAX_ENTRIES_SOFT_CAP;

  return (
    <div className="ws-list-editor">
      <div className="ws-list-editor-header">
        <label htmlFor="ws-entries-textarea" className="ws-label">
          Entries (one per line)
        </label>
        <span
          className={`ws-count-badge${tooFew ? ' ws-count-badge--low' : ''}`}
          aria-live="polite"
        >
          {parsedCount} {parsedCount === 1 ? 'entry' : 'entries'}
        </span>
      </div>
      <textarea
        id="ws-entries-textarea"
        className="ws-textarea"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={'Alice\nBob\nCharlie\n…'}
        rows={8}
        spellCheck={false}
        aria-describedby="ws-entries-hint"
      />
      <p id="ws-entries-hint" className="ws-hint">
        {tooMany
          ? `Maximum ${MAX_ENTRIES_SOFT_CAP} entries — remove some to save.`
          : tooFew
            ? `Add at least ${MIN_ENTRIES} entries to save and pick a winner.`
            : 'Lines are trimmed; duplicates and empty lines are ignored.'}
      </p>
    </div>
  );
}

ListEditor.propTypes = {
  text: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  parsedCount: PropTypes.number.isRequired,
};
