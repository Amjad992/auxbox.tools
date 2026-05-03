import ErrorBoundary from '../../../components/ErrorBoundary';

export default function CGPAErrorBoundary(props) {
  return (
    <ErrorBoundary
      message="There was an error loading the calculator. Please refresh the page."
      {...props}
    />
  );
}
