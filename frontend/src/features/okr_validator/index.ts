// OKR Validator Module Exports
export { OKRValidatorPage } from './pages/OKRValidatorPage';
export { default as ValidatingPage } from './pages/ValidatingPage';
export { default as ImprovingPage } from './pages/ImprovingPage';
export { default as ValidationResultsPage } from './pages/ValidationResultsPage';
export { default as CorrectionResultsPage } from './pages/CorrectionResultsPage';

// Component exports
export { default as OverallScoreCard } from './components/cards/OverallScoreCard';
export { default as StrategicPillarCard } from './components/cards/StrategicPillarCard';
export { default as FrameworkPerformanceCard } from './components/cards/FrameworkPerformanceCard';
export { default as ImprovementAreasCard } from './components/cards/ImprovementAreasCard';
export { default as DetailedAnalysisSection } from './components/cards/DetailedAnalysisSection';

// Modal exports
export { default as FrameworkDetailsModal } from './components/modals/FrameworkDetailsModal';
export { default as ImprovementAreasModal } from './components/modals/ImprovementAreasModal';

// API exports
export { validateOKRStream, correctOKRStream } from './services/api';

// Type exports
export * from './types';
