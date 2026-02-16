import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../../shared/services/api';
import type { WeeklySnapshot } from '../../../shared/types';
import { Layout } from '../../../shared/components/Layout';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { Alert } from '../../../shared/components/Alert';
import { ArrowLeft, Download, Users, Target, Activity, CheckCircle, ListTodo, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';

export const SnapshotDetailPage: React.FC = () => {
  const { teamId, week } = useParams<{ teamId: string; week: string }>();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<WeeklySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (teamId && week) {
      fetchSnapshot();
    }
  }, [teamId, week]);

  const fetchSnapshot = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getSnapshotByWeek(parseInt(teamId!), week!);
      setSnapshot(data);
    } catch (err: any) {
      console.error('Error fetching snapshot:', err);
      setError('Failed to load snapshot');
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return 'N/A';
    const numValue = typeof score === 'number' ? score : parseFloat(String(score));
    if (isNaN(numValue)) return 'N/A';
    return (numValue * 100).toFixed(1) + '%';
  };

  const formatHealth = (health: number | null | undefined): string => {
    if (health === null || health === undefined) return 'N/A';
    const numValue = typeof health === 'number' ? health : parseFloat(String(health));
    if (isNaN(numValue)) return 'N/A';
    return numValue.toFixed(1) + '%';
  };

  const generatePDF = () => {
    if (!snapshot || !reportRef.current) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPos = margin;
    const lineHeight = 7;
    const sectionSpacing = 10;

    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Helper function to add text with word wrap
    const addText = (text: string, fontSize: number, isBold: boolean = false, color: number[] = [0, 0, 0]) => {
      pdf.setFontSize(fontSize);
      pdf.setTextColor(color[0], color[1], color[2]);
      if (isBold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      const maxWidth = pageWidth - 2 * margin;
      const lines = pdf.splitTextToSize(text, maxWidth);
      
      for (const line of lines) {
        checkNewPage(lineHeight);
        pdf.text(line, margin, yPos);
        yPos += lineHeight;
      }
    };

    // Header
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Weekly Performance Snapshot', pageWidth / 2, 15, { align: 'center' });
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Week: ${snapshot.week} | Quarter: ${snapshot.quarter}`, pageWidth / 2, 25, { align: 'center' });
    
    yPos = 40;
    pdf.setTextColor(0, 0, 0);

    // Team Context
    addText('TEAM CONTEXT', 14, true, [41, 128, 185]);
    yPos += 3;
    addText(`Team Name: ${snapshot.team_name || 'N/A'}`, 11);
    addText(`Manager: ${snapshot.manager_name || 'N/A'}`, 11);
    addText(`Team Size: ${snapshot.team_size}`, 11);
    
    if (snapshot.team_members && snapshot.team_members.length > 0) {
      addText('Team Members:', 11, true);
      snapshot.team_members.forEach((member) => {
        addText(`  • ${member.name} (${member.role}${member.position ? ` - ${member.position}` : ''})`, 10);
      });
    }
    
    yPos += sectionSpacing;

    // OKR Details
    if (snapshot.okr_objective) {
      checkNewPage(30);
      pdf.setDrawColor(52, 152, 219);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      
      addText('OKR PERFORMANCE', 14, true, [52, 152, 219]);
      yPos += 3;
      addText(`Objective: ${snapshot.okr_objective}`, 11, true);
      addText(`Current Score: ${formatScore(snapshot.okr_current_score || snapshot.okr_objective_score)}`, 11);
      addText(`Target Score: ${formatScore(snapshot.okr_target_score)}`, 11);
      
      if (snapshot.okr_key_results && snapshot.okr_key_results.length > 0) {
        addText('Key Results:', 11, true);
        snapshot.okr_key_results.forEach((kr, idx) => {
          const progress = (kr.current / kr.target) * 100;
          addText(`  ${idx + 1}. ${kr.description}`, 10, true);
          addText(`     Progress: ${kr.current.toLocaleString()} / ${kr.target.toLocaleString()} ${kr.unit} (${progress.toFixed(1)}%)`, 9);
          addText(`     Score: ${formatScore(kr.score)} | Weight: ${(kr.weight * 100).toFixed(0)}%`, 9);
        });
      }
      
      yPos += sectionSpacing;
    }

    // BAU Activities
    if (snapshot.bau_activities && snapshot.bau_activities.length > 0) {
      checkNewPage(30);
      pdf.setDrawColor(46, 204, 113);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      
      addText('BAU ACTIVITIES', 14, true, [46, 204, 113]);
      yPos += 3;
      addText(`Overall Health: ${formatHealth(snapshot.bau_overall_health)}`, 11, true);
      
      snapshot.bau_activities.forEach((activity) => {
        checkNewPage(15);
        addText(`${activity.name}: ${activity.score.toFixed(1)}%`, 10, true);
        if (activity.metrics && activity.metrics.length > 0) {
          activity.metrics.forEach((metric) => {
            addText(`  • ${metric.name}: ${metric.current.toFixed(2)} / ${metric.target.toFixed(2)} (${metric.achievement.toFixed(1)}%)`, 9);
          });
        }
      });
      
      yPos += sectionSpacing;
    }

    // Weekly Priority Plan
    if (snapshot.weekly_priority_plan) {
      checkNewPage(30);
      pdf.setDrawColor(155, 89, 182);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      
      addText('WEEKLY PRIORITY PLAN', 14, true, [155, 89, 182]);
      yPos += 3;
      addText(`Week Focus: ${snapshot.weekly_priority_plan.week_focus || 'N/A'}`, 11);
      
      if (snapshot.weekly_priority_plan.p1_items && snapshot.weekly_priority_plan.p1_items.length > 0) {
        addText('P1 Items:', 11, true);
        snapshot.weekly_priority_plan.p1_items.forEach((item) => {
          addText(`  • ${item.title}`, 10);
        });
      }
      
      if (snapshot.weekly_priority_plan.p2_items && snapshot.weekly_priority_plan.p2_items.length > 0) {
        addText('P2 Items:', 11, true);
        snapshot.weekly_priority_plan.p2_items.forEach((item) => {
          addText(`  • ${item.title}`, 10);
        });
      }
      
      if (snapshot.weekly_priority_plan.p3_items && snapshot.weekly_priority_plan.p3_items.length > 0) {
        addText('P3 Items:', 11, true);
        snapshot.weekly_priority_plan.p3_items.forEach((item) => {
          addText(`  • ${item.title}`, 10);
        });
      }
      
      yPos += sectionSpacing;
    }

    // Work Items
    checkNewPage(30);
    pdf.setDrawColor(230, 126, 34);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    
    addText('WORK ITEMS', 14, true, [230, 126, 34]);
    yPos += 3;
    addText(`Completed: ${snapshot.work_items_count_completed} / ${snapshot.work_items_count_planned} (${formatHealth(snapshot.work_items_completion_rate)})`, 11);
    
    if (snapshot.work_items_planned && snapshot.work_items_planned.length > 0) {
      addText('Planned Work Items:', 11, true);
      snapshot.work_items_planned.forEach((item) => {
        addText(`  • ${item.title}`, 10);
        addText(`    Source: ${item.source_type} - ${item.source_name} | Priority: ${item.priority}`, 9);
      });
    }
    
    if (snapshot.work_items_completed && snapshot.work_items_completed.length > 0) {
      addText('Completed Work Items:', 11, true);
      snapshot.work_items_completed.forEach((item) => {
        addText(`  • ${item.title}`, 10);
        addText(`    Source: ${item.source_type} - ${item.source_name} | Priority: ${item.priority}`, 9);
      });
    }
    
    yPos += sectionSpacing;

    // Tasks
    if (snapshot.tasks && snapshot.tasks.length > 0) {
      checkNewPage(30);
      pdf.setDrawColor(142, 68, 173);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      
      addText('TASKS', 14, true, [142, 68, 173]);
      yPos += 3;
      addText(`Completed: ${snapshot.tasks_count_completed} / ${snapshot.tasks_count_planned} (${formatHealth(snapshot.tasks_completion_rate)})`, 11);
      
      snapshot.tasks.forEach((task) => {
        checkNewPage(10);
        const status = task.status === 'Done' ? '✓' : '○';
        addText(`${status} ${task.title}`, 10, task.status === 'Done');
        addText(`    Assignee: ${task.assignee} | Status: ${task.status}${task.effort_hours ? ` | Effort: ${task.effort_hours}h` : ''}`, 9);
      });
    }

    // Footer
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const fileName = `snapshot-${snapshot.team_name?.replace(/\s+/g, '-') || 'team'}-${snapshot.week}.pdf`;
    pdf.save(fileName);
  };

  if (loading) {
    return <Layout><LoadingSpinner /></Layout>;
  }

  if (error || !snapshot) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
          <Alert type="error" message={error || 'Snapshot not found'} onClose={() => navigate(-1)} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex justify-between items-start md:items-center gap-4 flex-col md:flex-row">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/teams/${teamId}/snapshots`)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <ArrowLeft size={18} />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-text-primary tracking-tight">Snapshot Details</h1>
              <p className="text-text-secondary mt-0.5">
                Week {snapshot.week} • {snapshot.quarter} • {snapshot.team_name || 'Team'}
              </p>
            </div>
          </div>
          <button
            onClick={generatePDF}
            className="btn btn-primary flex items-center space-x-2 whitespace-nowrap"
          >
            <Download size={18} />
            <span>Generate PDF Report</span>
          </button>
        </div>

        {/* Report Content */}
        <div ref={reportRef} className="bg-surface border border-border rounded-xl p-8 space-y-8">
          {/* Team Context */}
          <div className="border-l-4 border-primary pl-6">
            <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Users size={24} />
              Team Context
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-secondary">Team Name:</span>
                <span className="ml-2 text-text-primary font-medium">{snapshot.team_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-text-secondary">Manager:</span>
                <span className="ml-2 text-text-primary font-medium">{snapshot.manager_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-text-secondary">Team Size:</span>
                <span className="ml-2 text-text-primary font-medium">{snapshot.team_size}</span>
              </div>
              <div>
                <span className="text-text-secondary">Week:</span>
                <span className="ml-2 text-text-primary font-medium">{snapshot.week}</span>
              </div>
              <div>
                <span className="text-text-secondary">Quarter:</span>
                <span className="ml-2 text-text-primary font-medium">{snapshot.quarter}</span>
              </div>
              <div>
                <span className="text-text-secondary">Snapshot Date:</span>
                <span className="ml-2 text-text-primary font-medium">
                  {new Date(snapshot.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            {snapshot.team_members && snapshot.team_members.length > 0 && (
              <div className="mt-4">
                <span className="text-text-secondary font-medium">Team Members:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {snapshot.team_members.map((member) => (
                    <span key={member.id} className="px-3 py-1.5 bg-background border border-border rounded text-sm">
                      {member.name} ({member.role}{member.position ? ` - ${member.position}` : ''})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* OKR Details */}
          {snapshot.okr_objective && (
            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Target size={24} />
                OKR Performance
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-text-secondary">Objective:</span>
                  <p className="mt-1 text-text-primary font-medium text-lg">{snapshot.okr_objective}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-background border border-border rounded">
                    <span className="text-text-secondary text-sm">Current Score</span>
                    <p className={`text-2xl font-bold mt-1 ${
                      snapshot.okr_current_score && snapshot.okr_current_score >= 0.7 ? 'text-green-600' :
                      snapshot.okr_current_score && snapshot.okr_current_score >= 0.4 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {formatScore(snapshot.okr_current_score || snapshot.okr_objective_score)}
                    </p>
                  </div>
                  <div className="p-4 bg-background border border-border rounded">
                    <span className="text-text-secondary text-sm">Target Score</span>
                    <p className="text-2xl font-bold mt-1 text-text-primary">
                      {formatScore(snapshot.okr_target_score)}
                    </p>
                  </div>
                </div>
                {snapshot.okr_key_results && snapshot.okr_key_results.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Key Results</h3>
                    <div className="space-y-4">
                      {snapshot.okr_key_results.map((kr) => {
                        const progress = (kr.current / kr.target) * 100;
                        return (
                          <div key={kr.id} className="p-4 bg-background border border-border rounded">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <div className="font-medium text-text-primary">{kr.description}</div>
                                <div className="mt-1 text-sm text-text-secondary">
                                  Progress: {kr.current.toLocaleString()} / {kr.target.toLocaleString()} {kr.unit}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-text-primary">{formatScore(kr.score)}</div>
                                <div className="text-xs text-text-secondary">Weight: {(kr.weight * 100).toFixed(0)}%</div>
                              </div>
                            </div>
                            <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-blue-500 h-3 rounded-full transition-all"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                            <div className="mt-1 text-xs text-text-secondary text-right">
                              {progress.toFixed(1)}% Complete
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BAU Activities */}
          {snapshot.bau_activities && snapshot.bau_activities.length > 0 && (
            <div className="border-l-4 border-green-500 pl-6">
              <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Activity size={24} />
                BAU Activities
              </h2>
              <div className="mb-4 p-4 bg-background border border-border rounded">
                <span className="text-text-secondary">Overall Health:</span>
                <span className={`ml-2 text-2xl font-bold ${
                  snapshot.bau_overall_health && snapshot.bau_overall_health >= 95 ? 'text-green-600' :
                  snapshot.bau_overall_health && snapshot.bau_overall_health >= 85 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {formatHealth(snapshot.bau_overall_health)}
                </span>
              </div>
              <div className="space-y-4">
                {snapshot.bau_activities.map((activity) => (
                  <div key={activity.id} className="p-4 bg-background border border-border rounded">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-medium text-text-primary text-lg">{activity.name}</span>
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        activity.score >= 95 ? 'bg-green-100 text-green-800' :
                        activity.score >= 85 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {activity.score.toFixed(1)}%
                      </span>
                    </div>
                    {activity.metrics && activity.metrics.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {activity.metrics.map((metric, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary">{metric.name}:</span>
                            <span className="text-text-primary font-medium">
                              {metric.current.toFixed(2)} / {metric.target.toFixed(2)} ({metric.achievement.toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Priority Plan */}
          {snapshot.weekly_priority_plan && (
            <div className="border-l-4 border-purple-500 pl-6">
              <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Calendar size={24} />
                Weekly Priority Plan
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-background border border-border rounded">
                  <span className="text-text-secondary">Week Focus:</span>
                  <p className="mt-1 text-text-primary font-medium">{snapshot.weekly_priority_plan.week_focus || 'N/A'}</p>
                </div>
                {snapshot.weekly_priority_plan.p1_items && snapshot.weekly_priority_plan.p1_items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">P1 Items (Critical)</h3>
                    <ul className="space-y-2">
                      {snapshot.weekly_priority_plan.p1_items.map((item) => (
                        <li key={item.id} className="p-3 bg-background border border-red-300 rounded flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          <span className="text-text-primary">{item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {snapshot.weekly_priority_plan.p2_items && snapshot.weekly_priority_plan.p2_items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">P2 Items (Important)</h3>
                    <ul className="space-y-2">
                      {snapshot.weekly_priority_plan.p2_items.map((item) => (
                        <li key={item.id} className="p-3 bg-background border border-yellow-300 rounded flex items-start">
                          <span className="text-yellow-500 mr-2">•</span>
                          <span className="text-text-primary">{item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {snapshot.weekly_priority_plan.p3_items && snapshot.weekly_priority_plan.p3_items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">P3 Items (Normal)</h3>
                    <ul className="space-y-2">
                      {snapshot.weekly_priority_plan.p3_items.map((item) => (
                        <li key={item.id} className="p-3 bg-background border border-blue-300 rounded flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-text-primary">{item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Work Items */}
          <div className="border-l-4 border-orange-500 pl-6">
            <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
              <CheckCircle size={24} />
              Work Items
            </h2>
            <div className="mb-4 p-4 bg-background border border-border rounded">
              <span className="text-text-secondary">Completion Rate:</span>
              <span className="ml-2 text-2xl font-bold text-text-primary">
                {snapshot.work_items_count_completed} / {snapshot.work_items_count_planned} ({formatHealth(snapshot.work_items_completion_rate)})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {snapshot.work_items_planned && snapshot.work_items_planned.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Planned ({snapshot.work_items_planned.length})</h3>
                  <div className="space-y-3">
                    {snapshot.work_items_planned.map((item) => (
                      <div key={item.id} className="p-4 bg-background border border-border rounded">
                        <div className="font-medium text-text-primary">{item.title}</div>
                        <div className="mt-2 text-sm text-text-secondary">
                          <div>Source: {item.source_type} - {item.source_name}</div>
                          <div>Priority: {item.priority}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {snapshot.work_items_completed && snapshot.work_items_completed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3">Completed ({snapshot.work_items_completed.length})</h3>
                  <div className="space-y-3">
                    {snapshot.work_items_completed.map((item) => (
                      <div key={item.id} className="p-4 bg-background border border-green-500 rounded">
                        <div className="font-medium text-text-primary flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-500" />
                          {item.title}
                        </div>
                        <div className="mt-2 text-sm text-text-secondary">
                          <div>Source: {item.source_type} - {item.source_name}</div>
                          <div>Priority: {item.priority}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tasks */}
          {snapshot.tasks && snapshot.tasks.length > 0 && (
            <div className="border-l-4 border-indigo-500 pl-6">
              <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                <ListTodo size={24} />
                Tasks
              </h2>
              <div className="mb-4 p-4 bg-background border border-border rounded">
                <span className="text-text-secondary">Completion Rate:</span>
                <span className="ml-2 text-2xl font-bold text-text-primary">
                  {snapshot.tasks_count_completed} / {snapshot.tasks_count_planned} ({formatHealth(snapshot.tasks_completion_rate)})
                </span>
              </div>
              <div className="space-y-3">
                {snapshot.tasks.map((task) => (
                  <div key={task.id} className={`p-4 bg-background border rounded ${
                    task.status === 'Done' ? 'border-green-500' : 'border-border'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-text-primary flex items-center gap-2">
                          {task.status === 'Done' && <CheckCircle size={16} className="text-green-500" />}
                          {task.title}
                        </div>
                        <div className="mt-2 text-sm text-text-secondary">
                          <div>Assignee: {task.assignee}</div>
                          <div>Status: {task.status}</div>
                          {task.effort_hours && <div>Effort: {task.effort_hours} hours</div>}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        task.status === 'Done' ? 'bg-green-100 text-green-800' :
                        task.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 border-t border-border text-center text-sm text-text-secondary">
            <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            <p className="mt-1">Snapshot Version: {snapshot.snapshot_version || '1.0'}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

