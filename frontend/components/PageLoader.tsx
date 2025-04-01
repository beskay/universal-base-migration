import LoadingSpinner from './LoadingSpinner';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-secondary font-medium">Loading...</p>
      </div>
    </div>
  );
} 