import PropTypes from 'prop-types';
import Button from '../../../components/Button';
import SubjectRow from './SubjectRow';
import {calculateSemesterGPA} from '../utils';

export default function SemesterCard({
  semester,
  customGrades,
  onUpdateSemesterName,
  onAddSubject,
  onRemoveSubject,
  onUpdateSubject,
  onRemoveSemester,
  canRemoveSemester,
}) {
  const {gpa, totalCredits} = calculateSemesterGPA(
    semester.subjects,
    customGrades
  );

  return (
    <div className="semester-container">
      <div className="semester-header">
        <input
          type="text"
          value={semester.name}
          onChange={(e) => onUpdateSemesterName(semester.id, e.target.value)}
          className="semester-name-input"
        />
        <div className="semester-stats">
          <span className="semester-gpa">GPA: {gpa.toFixed(2)}</span>
          <span className="semester-credits">Credits: {totalCredits}</span>
        </div>
        <div className="semester-actions">
          <Button variant="info" onClick={() => onAddSubject(semester.id)}>
            + Add Subject
          </Button>
          <Button
            variant="danger"
            onClick={() => onRemoveSemester(semester.id)}
            disabled={!canRemoveSemester}
          >
            Remove Semester
          </Button>
        </div>
      </div>

      <div className="subjects-container">
        <div className="subjects-header">
          <div className="col-subject">Subject Name</div>
          <div className="col-credits">Credit Hours</div>
          <div className="col-grade">Grade</div>
          <div className="col-points">Grade Points</div>
          <div className="col-action">Action</div>
        </div>

        {semester.subjects.map((subject, index) => (
          <SubjectRow
            key={`${semester.id}-${index}`}
            semester={semester}
            subject={subject}
            subjectIndex={index}
            customGrades={customGrades}
            onUpdateSubject={onUpdateSubject}
            onRemoveSubject={onRemoveSubject}
          />
        ))}
      </div>
    </div>
  );
}

SemesterCard.propTypes = {
  semester: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    subjects: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        creditHours: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
          .isRequired,
        grade: PropTypes.string.isRequired,
        gradePoints: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
  customGrades: PropTypes.objectOf(PropTypes.number).isRequired,
  onUpdateSemesterName: PropTypes.func.isRequired,
  onAddSubject: PropTypes.func.isRequired,
  onRemoveSubject: PropTypes.func.isRequired,
  onUpdateSubject: PropTypes.func.isRequired,
  onRemoveSemester: PropTypes.func.isRequired,
  canRemoveSemester: PropTypes.bool.isRequired,
};
