import PropTypes from 'prop-types';
import Button from '../../../components/Button';
import {useStorageData} from '../StorageContext';
import {useSaveButton} from '../useSaveButton';

export default function CalculatorHeader({
  onAddSemester,
  onResetCalculator,
  semesters,
}) {
  const {saveSemesters, clearSemesters, hasSavedData} = useStorageData();
  const [saveButtonText, triggerSaveSemesters] = useSaveButton(
    'Save Subjects',
    'Saved!'
  );

  const handleSaveSemesters = () => {
    if (saveSemesters(semesters)) triggerSaveSemesters();
  };

  return (
    <div className="calculator-header">
      <h3>Enter Semesters and Subjects</h3>
      <div className="calculator-actions">
        <Button variant="info" onClick={onAddSemester}>
          Add Semester
        </Button>
        <Button variant="warning" onClick={onResetCalculator}>
          Reset All
        </Button>
        <Button variant="success" onClick={handleSaveSemesters}>
          {saveButtonText}
        </Button>
        {hasSavedData.semesters && (
          <Button variant="neutral" onClick={clearSemesters}>
            Clear Saved Data
          </Button>
        )}
      </div>
    </div>
  );
}

CalculatorHeader.propTypes = {
  onAddSemester: PropTypes.func.isRequired,
  onResetCalculator: PropTypes.func.isRequired,
  semesters: PropTypes.array.isRequired,
};
