import React, { useRef, useState } from 'react';
import { Download, Sparkles } from 'lucide-react';
import type { ValidateOKRResponse } from '../types';
// import { generateOKRValidationPDF } from '../utils/pdfGenerator';
import OverallScoreCard from '../components/cards/OverallScoreCard';
import StrategicPillarCard from '../components/cards/StrategicPillarCard';
import FrameworkPerformanceCard from '../components/cards/FrameworkPerformanceCard';
import ImprovementAreasCard from '../components/cards/ImprovementAreasCard';
import DetailedAnalysisSection from '../components/cards/DetailedAnalysisSection';
import FrameworkDetailsModal from '../components/modals/FrameworkDetailsModal';
import ImprovementAreasModal from '../components/modals/ImprovementAreasModal';

interface ValidationResultsPageProps {
  validationData: ValidateOKRResponse;
  onImprove: () => void;
  onDownloadDetailAnalysis: () => void;
}

const ValidationResultsPage: React.FC<ValidationResultsPageProps> = ({
  validationData,
  onImprove,
  onDownloadDetailAnalysis
}) => {
  const detailAnalysisRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const [showFrameworkModal, setShowFrameworkModal] = useState(false);
  const [showIssuesModal, setShowIssuesModal] = useState(false);

  const handleDownloadDetailAnalysis = async () => {
    onDownloadDetailAnalysis();
  };

  const handleOpenFrameworkModal = () => {
    setShowFrameworkModal(true);
  };

  const handleOpenIssuesModal = () => {
    setShowIssuesModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Action Buttons */}
      <div className="flex items-start justify-between mb-12 gap-8">
        <div className="flex-1 text-center">
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            AI Validation Report
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Comprehensive analysis using <span className="text-text-primary font-semibold">S.C.A.L.E.I.T</span>, <span className="text-text-primary font-semibold">C.L.E.A.R</span>, and <span className="text-text-primary font-semibold">OKR Alignment</span> frameworks
          </p>
        </div>

        {/* Action Buttons - Top Right */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onImprove}
            className="btn btn-secondary whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            AI Improve
          </button>
          <button
            onClick={handleDownloadDetailAnalysis}
            className="btn btn-primary whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Overall Score */}
        <div className="lg:col-span-1">
          <OverallScoreCard validationData={validationData} />
        </div>

        {/* Strategic Alignment */}
        <div className="lg:col-span-1">
          <StrategicPillarCard validationData={validationData} />
        </div>

        {/* Framework Scores */}
        <div className="lg:col-span-1">
          <FrameworkPerformanceCard
            validationData={validationData}
            onOpenModal={handleOpenFrameworkModal}
          />
        </div>

        {/* Issues Summary */}
        <div className="lg:col-span-1">
          <ImprovementAreasCard
            validationData={validationData}
            onOpenModal={handleOpenIssuesModal}
          />
        </div>
      </div>

      {/* Detailed Analysis Section */}
      <DetailedAnalysisSection
        validationData={validationData}
        detailAnalysisRef={detailAnalysisRef}
      />

      {/* Framework Details Modal */}
      <FrameworkDetailsModal
        isOpen={showFrameworkModal}
        onClose={() => setShowFrameworkModal(false)}
        validationData={validationData}
      />

      {/* Improvement Areas Modal */}
      <ImprovementAreasModal
        isOpen={showIssuesModal}
        onClose={() => setShowIssuesModal(false)}
        validationData={validationData}
      />
    </div>
  );
};

export default ValidationResultsPage;
