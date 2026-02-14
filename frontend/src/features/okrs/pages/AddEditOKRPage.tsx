import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { OKRForm } from '../components/OKRForm';
import { useAuth } from '../../../app/context/AuthContext';
import { api } from '../../../shared/services/api';
import type { OKRCreate, OKRDetail } from '../../../shared/types';
import { ArrowLeft } from 'lucide-react';

export const AddEditOKRPage: React.FC = () => {
  const navigate = useNavigate();
  useAuth();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState('');
  const [okr, setOkr] = useState<OKRDetail | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadOKR();
    }
  }, [isEditing, id]);

  const loadOKR = async () => {
    try {
      const data = await api.getOKR(parseInt(id!));
      setOkr(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load OKR');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (okrData: OKRCreate) => {
    setError('');
    try {
      if (isEditing && id) {
        // Update OKR
        await api.updateOKR(parseInt(id), {
          okr_level: okrData.okr_level,
          year: okrData.year,
          quarter: okrData.quarter,
          objective: okrData.objective,
          description: okrData.description,
          status: okrData.status,
        });
        
        // Handle key results separately
        if (okrData.key_results) {
          const existingKRs = okr?.key_results || [];
          const existingKRIds = new Set(existingKRs.map(kr => kr.id));
          
          // Delete removed KRs
          for (const existingKR of existingKRs) {
            const stillExists = okrData.key_results.some(
              (kr: any) => kr.id && kr.id === existingKR.id
            );
            if (!stillExists) {
              await api.deleteKeyResult(existingKR.id);
            }
          }
          
          // Update or create KRs
          for (const krData of okrData.key_results) {
            const krPayload = {
              description: krData.description,
              base_value: parseFloat(krData.base_value.toString()),
              target_value: parseFloat(krData.target_value.toString()),
              unit: krData.unit,
              weight: parseFloat(krData.weight.toString()),
            };
            
            if ((krData as any).id && existingKRIds.has((krData as any).id)) {
              await api.updateKeyResult((krData as any).id, krPayload);
            } else {
              await api.createKeyResult(parseInt(id), krPayload);
            }
          }
        }
      } else {
        // Create new OKR
        await api.addOKR(okrData);
      }
      navigate('/okrs');
    } catch (err: any) {
      setError(err.response?.data?.detail || (isEditing ? 'Failed to update OKR' : 'Failed to create OKR'));
    }
  };

  const handleCancel = () => {
    navigate('/okrs');
  };

  if (loading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
              title="Back to OKRs"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                {isEditing ? 'Edit OKR' : 'Create New OKR'}
              </h1>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert 
            type="error" 
            message={error} 
            onClose={() => setError('')} 
          />
        )}

        {/* Form Card */}
        <div className="bg-surface border border-border rounded-lg p-5">
          <OKRForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={okr ? {
              okr_level: okr.okr_level,
              year: okr.year,
              quarter: okr.quarters as any,
              objective: okr.objective,
              description: okr.description || undefined,
              status: okr.status,
              key_results: okr.key_results?.map(kr => ({
                id: kr.id,
                description: kr.description,
                base_value: kr.base_value,
                target_value: kr.target_value,
                unit: kr.unit,
                weight: kr.weight,
              })) || undefined,
            } : undefined}
            isEditing={isEditing}
          />
        </div>
      </div>
    </Layout>
  );
};

