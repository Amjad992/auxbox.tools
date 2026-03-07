'use client';
import {useEffect} from 'react';
import Script from 'next/script';
import HeroSection from './components/HeroSection';
import GradeManagement from './components/GradeManagement';
import CalculatorHeader from './components/CalculatorHeader';
import SemesterCard from './components/SemesterCard';
import ResultsSection from './components/ResultsSection';
import ErrorBoundary from './components/ErrorBoundary';
import {useCGPACalculator, useGradeManagement} from './hooks';
import {StorageProvider, useStorageData} from './StorageContext';
import {useToast} from './useToast';
import './cgpa-calculator.css';

function CGPACalculatorContent() {
  // Toast notifications
  const {toasts, showToast, dismissToast} = useToast();

  // Storage hook for error display
  const {storageErrors} = useStorageData();

  // Show toast when storage errors occur
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

  // Grade management hook
  const {
    customGrades,
    updateCustomGrade,
    addCustomGrade,
    removeCustomGrade,
    resetGradesToDefault,
  } = useGradeManagement();

  // CGPA calculator hook
  const {
    semesters,
    cgpa,
    totalCredits,
    addSemester,
    removeSemester,
    updateSemesterName,
    addSubject,
    removeSubject,
    updateSubject,
    resetCalculator,
  } = useCGPACalculator(customGrades);

  // Helper to update subject with access to customGrades
  const handleUpdateSubject = (semesterId, subjectIndex, field, value) => {
    updateSubject(semesterId, subjectIndex, field, value, customGrades);
  };

  return (
    <main className="cgpa-calculator-page">
        {/* Toast notifications */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast toast-${toast.type}`}
              onClick={() => dismissToast(toast.id)}
            >
              <span className="toast-icon">⚠️</span>
              <span className="toast-message">{toast.message}</span>
              <button
                className="toast-close"
                onClick={() => dismissToast(toast.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <ErrorBoundary>
          <div className="container">
            <HeroSection />

          <GradeManagement
            customGrades={customGrades}
            onUpdateGrade={updateCustomGrade}
            onAddGrade={addCustomGrade}
            onRemoveGrade={removeCustomGrade}
            onResetGrades={resetGradesToDefault}
          />

          {/* Calculator Section */}
          <section className="calculator-section">
            <CalculatorHeader
              onAddSemester={addSemester}
              onResetCalculator={resetCalculator}
              semesters={semesters}
            />

            {/* Semesters */}
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
          </div>
        </ErrorBoundary>
      </main>
  );
}

export default function CGPACalculator() {
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CGPA Calculator',
    description:
      'Free online CGPA and GPA calculator. Calculate your cumulative grade point average with precision.',
    url: 'https://auxbox.tools/cgpa-calculator',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <Script
        id="webapp-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webAppSchema),
        }}
      />
      <StorageProvider>
        <CGPACalculatorContent />
      </StorageProvider>
    </>
  );
}
