'use client';
import {useEffect} from 'react';
import ToolPage from '../../components/ToolPage';
import ToastContainer from '../../components/ToastContainer';
import GradeManagement from './components/GradeManagement';
import CalculatorHeader from './components/CalculatorHeader';
import SemesterCard from './components/SemesterCard';
import ResultsSection from './components/ResultsSection';
import {useCGPACalculator, useGradeManagement} from './hooks';
import {StorageProvider, useStorageData} from './StorageContext';
import {useToast} from '../../hooks/useToast';
import './cgpa-calculator.css';

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CGPA Calculator',
  description:
    'Free online CGPA and GPA calculator. Calculate your cumulative grade point average with precision.',
  url: 'https://auxbox.tools/cgpa-calculator',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
};

function CGPACalculatorContent() {
  const {toasts, showToast, dismissToast} = useToast();
  const {storageErrors} = useStorageData();

  useEffect(() => {
    if (storageErrors.grades) {
      showToast(`Grades: ${storageErrors.grades}. Using defaults.`, 'error');
    }
    if (storageErrors.semesters) {
      showToast(
        `Semesters: ${storageErrors.semesters}. Using defaults.`,
        'error'
      );
    }
  }, [storageErrors.grades, storageErrors.semesters, showToast]);

  const {
    customGrades,
    updateCustomGrade,
    addCustomGrade,
    removeCustomGrade,
    resetGradesToDefault,
  } = useGradeManagement();

  const {
    semesters,
    addSemester,
    removeSemester,
    updateSemesterName,
    addSubject,
    removeSubject,
    updateSubject,
    resetCalculator,
    cgpa,
    totalCredits,
  } = useCGPACalculator(customGrades);

  const handleUpdateSubject = (semesterId, subjectIndex, field, value) => {
    updateSubject(semesterId, subjectIndex, field, value, customGrades);
  };

  return (
    <ToolPage
      title="CGPA and GPA Calculator!"
      tagline="Calculate your CGPA and GPA with precision"
      schema={SCHEMA}
      schemaId="cgpa-schema"
      errorMessage="There was an error loading the calculator. Please refresh the page."
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <GradeManagement
        customGrades={customGrades}
        onUpdateGrade={updateCustomGrade}
        onAddGrade={addCustomGrade}
        onRemoveGrade={removeCustomGrade}
        onResetGrades={resetGradesToDefault}
      />

      <section className="calculator-section">
        <CalculatorHeader
          onAddSemester={addSemester}
          onResetCalculator={resetCalculator}
          semesters={semesters}
        />

        {semesters.map((semester) => (
          <SemesterCard
            key={semester.id}
            semester={semester}
            customGrades={customGrades}
            onUpdateSemesterName={updateSemesterName}
            onAddSubject={addSubject}
            onRemoveSubject={removeSubject}
            onUpdateSubject={handleUpdateSubject}
            onRemoveSemester={removeSemester}
            canRemoveSemester={semesters.length > 1}
          />
        ))}
      </section>

      <ResultsSection
        cgpa={cgpa}
        totalCredits={totalCredits}
        semesterCount={semesters.length}
      />
    </ToolPage>
  );
}

export default function CGPACalculator() {
  return (
    <StorageProvider>
      <CGPACalculatorContent />
    </StorageProvider>
  );
}
