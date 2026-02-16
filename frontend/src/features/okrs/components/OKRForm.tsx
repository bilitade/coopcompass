import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import type { OKRCreate } from '../../../shared/types';

interface OKRFormProps {
  onSubmit: (data: OKRCreate) => void;
  onCancel: () => void;
  initialData?: Partial<OKRCreate>;
  isEditing?: boolean;
}

interface KeyResultRow {
  tempId: string;
  id?: number;
  description: string;
  base_value: string;
  target_value: string;
  unit: string;
  weight: string;
}

export const OKRForm: React.FC<OKRFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData,
  isEditing = false 
}) => {
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    okr_level: initialData?.okr_level || ('strategic' as const),
    year: initialData?.year || currentYear,
    quarter: initialData?.quarter || ('Q1' as const),
    objective: initialData?.objective || '',
    description: initialData?.description || '',
    status: initialData?.status || ('draft' as const),
  });

  const [keyResults, setKeyResults] = useState<KeyResultRow[]>(
    initialData?.key_results?.map((kr, idx) => ({
      tempId: `kr-${idx}`,
      id: (kr as any).id,
      description: kr.description,
      base_value: kr.base_value.toString(),
      target_value: kr.target_value.toString(),
      unit: kr.unit,
      weight: kr.weight.toString(),
    })) || []
  );

  const [errors, setErrors] = useState<string[]>([]);

  const addKeyResult = () => {
    setKeyResults([...keyResults, {
      tempId: `kr-${Date.now()}`,
      description: '',
      base_value: '',
      target_value: '',
      unit: '',
      weight: '',
    }]);
  };

  const removeKeyResult = (tempId: string) => {
    setKeyResults(keyResults.filter(kr => kr.tempId !== tempId));
  };

  const updateKeyResult = (tempId: string, field: keyof KeyResultRow, value: string) => {
    setKeyResults(keyResults.map(kr => 
      kr.tempId === tempId ? { ...kr, [field]: value } : kr
    ));
  };

  const calculateTotalWeight = (): number => {
    return keyResults.reduce((sum, kr) => {
      const weight = parseFloat(kr.weight || '0');
      return sum + (isNaN(weight) ? 0 : weight);
    }, 0);
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.objective.trim()) {
      newErrors.push('Objective is required');
    }

    if (keyResults.length > 0) {
      keyResults.forEach((kr, idx) => {
        if (!kr.description.trim()) newErrors.push(`KR ${idx + 1}: Description required`);
        if (!kr.base_value || isNaN(parseFloat(kr.base_value))) newErrors.push(`KR ${idx + 1}: Valid base value required`);
        if (!kr.target_value || isNaN(parseFloat(kr.target_value))) newErrors.push(`KR ${idx + 1}: Valid target value required`);
        if (!kr.unit.trim()) newErrors.push(`KR ${idx + 1}: Unit required`);
        if (!kr.weight || isNaN(parseFloat(kr.weight))) newErrors.push(`KR ${idx + 1}: Valid weight required`);
      });

      const totalWeight = calculateTotalWeight();
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        newErrors.push(`Key Results weights must sum to 1.0 (currently ${totalWeight.toFixed(3)})`);
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const okrData: OKRCreate = {
      okr_level: formData.okr_level,
      year: formData.year,
      quarter: formData.quarter,
      objective: formData.objective,
      description: formData.description || undefined,
      status: formData.status,
      key_results: keyResults.length > 0 ? keyResults.map(kr => ({
        ...(kr.id && { id: kr.id }),
        description: kr.description,
        base_value: parseFloat(kr.base_value),
        target_value: parseFloat(kr.target_value),
        unit: kr.unit,
        weight: parseFloat(kr.weight),
      })) : undefined,
    };

    onSubmit(okrData);
  };

  const totalWeight = calculateTotalWeight();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-red-600" />
            <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">Please fix these errors:</h4>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-sm text-red-700 dark:text-red-300">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* OKR Level, Year and Quarter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label text-sm mb-2">OKR Level *</label>
          <div className="grid grid-cols-3 gap-2">
            {(['strategic', 'operational', 'tactical'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setFormData({ ...formData, okr_level: level })}
                className={`p-2.5 rounded-md border-2 transition-all text-sm font-medium capitalize ${
                  formData.okr_level === level
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 text-text-secondary'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label text-sm mb-2">Year *</label>
          <select
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            className="input w-full h-9"
            required
          >
            {Array.from({ length: 10 }, (_, i) => currentYear + i).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label text-sm mb-2">Quarter *</label>
          <div className="grid grid-cols-4 gap-2">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setFormData({ ...formData, quarter: q })}
                className={`p-2.5 rounded-md border-2 transition-all text-sm font-medium ${
                  formData.quarter === q
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 text-text-secondary'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Objective and Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="label text-sm mb-2">Objective *</label>
          <textarea
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            className="input w-full"
            rows={2}
            placeholder="What do you want to achieve?"
            required
            maxLength={1000}
          />
          <p className="text-xs text-text-secondary mt-1">{formData.objective.length}/1000</p>
        </div>

        <div>
          <label className="label text-sm mb-2">Status *</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="input w-full h-9"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label text-sm mb-2">Description (Optional)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input w-full"
          rows={2}
          placeholder="Additional context..."
          maxLength={5000}
        />
      </div>

      {/* Key Results */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Key Results</h3>
            <p className="text-xs text-text-secondary mt-0.5">Define measurable outcomes (weights must sum to 1.0)</p>
          </div>
          <button
            type="button"
            onClick={addKeyResult}
            className="btn btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <Plus size={16} />
            Add KR
          </button>
        </div>

        {keyResults.length > 0 && (
          <div className="mb-3 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Total Weight:</strong>{' '}
              <span className={`font-bold ${Math.abs(totalWeight - 1.0) <= 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {totalWeight.toFixed(2)} / 1.00
              </span>
              {Math.abs(totalWeight - 1.0) <= 0.01 ? ' ✓' : ' ⚠️'}
            </p>
          </div>
        )}

        {keyResults.length > 0 ? (
          <div className="space-y-3">
            {keyResults.map((kr, idx) => (
              <div key={kr.tempId} className="border border-border rounded-lg p-4 bg-surface-hover/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-text-primary">Key Result #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyResult(kr.tempId)}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Description */}
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-1.5 block">Description *</label>
                    <input
                      type="text"
                      value={kr.description}
                      onChange={(e) => updateKeyResult(kr.tempId, 'description', e.target.value)}
                      className="input w-full text-sm h-9"
                      placeholder="Enter key result description"
                    />
                  </div>

                  {/* Base, Target, Unit, Weight in grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-1.5 block">Base Value *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={kr.base_value}
                        onChange={(e) => updateKeyResult(kr.tempId, 'base_value', e.target.value)}
                        className="input w-full text-sm h-9"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-1.5 block">Target Value *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={kr.target_value}
                        onChange={(e) => updateKeyResult(kr.tempId, 'target_value', e.target.value)}
                        className="input w-full text-sm h-9"
                        placeholder="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-1.5 block">Unit *</label>
                      <input
                        type="text"
                        value={kr.unit}
                        onChange={(e) => updateKeyResult(kr.tempId, 'unit', e.target.value)}
                        className="input w-full text-sm h-9"
                        placeholder="%"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-1.5 block">Weight *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={kr.weight}
                        onChange={(e) => updateKeyResult(kr.tempId, 'weight', e.target.value)}
                        className="input w-full text-sm h-9"
                        placeholder="0.25"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border-2 border-dashed border-border rounded-lg bg-surface/30">
            <p className="text-sm text-text-secondary">No key results yet</p>
            <p className="text-xs text-text-secondary mt-1">Click "Add KR" to start</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary flex-1">
          {isEditing ? 'Update OKR' : 'Create OKR'}
        </button>
      </div>
    </form>
  );
};

