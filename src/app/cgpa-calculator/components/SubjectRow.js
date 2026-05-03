import PropTypes from 'prop-types';
import Button from '../../../components/Button';
import {CREDIT_HOUR_LIMITS} from '../constants';

export default function SubjectRow({
  semester,
  subject,
  subjectIndex,
  customGrades,
  onUpdateSubject,
  onRemoveSubject,
}) {
  return (
    <div className="subject-row">
      <input
        type="text"
        placeholder="Enter subject name"
        value={subject.name}
        onChange={(e) =>
          onUpdateSubject(semester.id, subjectIndex, 'name', e.target.value)
        }
        className="subject-input"
      />
      <input
        type="number"
        placeholder="Credits"
        min={CREDIT_HOUR_LIMITS.min}
        step={CREDIT_HOUR_LIMITS.step}
        value={subject.creditHours}
        onChange={(e) =>
          onUpdateSubject(
            semester.id,
            subjectIndex,
            'creditHours',
            e.target.value
          )
        }
        className="credits-input"
      />
      <select
        value={subject.grade}
        onChange={(e) =>
          onUpdateSubject(semester.id, subjectIndex, 'grade', e.target.value)
        }
        className="grade-select"
      >
        <option value="">Select Grade</option>
        {Object.keys(customGrades).map((grade) => (
          <option key={grade} value={grade}>
            {grade}
          </option>
        ))}
      </select>
      <div className="grade-points-display">
        {subject.gradePoints.toFixed(2)}
      </div>
      <Button
        variant="danger"
        onClick={() => onRemoveSubject(semester.id, subjectIndex)}
        disabled={semester.subjects.length === 1}
      >
        Remove
      </Button>
    </div>
  );
}

SubjectRow.propTypes = {
  semester: PropTypes.shape({
    id: PropTypes.number.isRequired,
    subjects: PropTypes.array.isRequired,
  }).isRequired,
  subject: PropTypes.shape({
    name: PropTypes.string.isRequired,
    creditHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      .isRequired,
    grade: PropTypes.string.isRequired,
    gradePoints: PropTypes.number.isRequired,
  }).isRequired,
  subjectIndex: PropTypes.number.isRequired,
  customGrades: PropTypes.objectOf(PropTypes.number).isRequired,
  onUpdateSubject: PropTypes.func.isRequired,
  onRemoveSubject: PropTypes.func.isRequired,
};
