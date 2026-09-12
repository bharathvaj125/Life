import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { CyberCard, CyberBadge, CyberButton } from '../ui/CyberComponents';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  Crosshair,
  Sparkles,
  Layers,
  X,
  Zap,
  Coins,
} from 'lucide-react';

const DIFFICULTY_CONFIG = {
  trivial: { label: 'TRIVIAL', badge: 'slate', xp: 5, credits: 2 },
  easy: { label: 'EASY', badge: 'emerald', xp: 10, credits: 5 },
  medium: { label: 'MEDIUM', badge: 'cyan', xp: 20, credits: 10 },
  hard: { label: 'HARD', badge: 'amber', xp: 35, credits: 18 },
  epic: { label: 'EPIC', badge: 'magenta', xp: 60, credits: 35 },
};

export function MissionHub() {
  const { missions, loadingMissions, completeMission, createMission, updateMission, deleteMission } = useGame();
  const [filter, setFilter] = useState('active'); // 'active' | 'completed' | 'all'
  const [isCreating, setIsCreating] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState(null);

  // Mission Form State (shared by create and edit)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [attribute, setAttribute] = useState('Intellect');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const filteredMissions = missions.filter((m) => {
    if (filter === 'active') return m.status === 'active';
    if (filter === 'completed') return m.status === 'completed';
    return true;
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDifficulty('medium');
    setAttribute('Intellect');
    setDueDate('');
    setFormError('');
    setEditingMissionId(null);
    setIsCreating(false);
  };

  const openEditForm = (mission) => {
    setEditingMissionId(mission.id);
    setTitle(mission.title || '');
    setDescription(mission.description || '');
    setDifficulty(mission.difficulty || 'medium');
    setAttribute(mission.attribute || 'Intellect');
    setDueDate(mission.due_date || '');
    setFormError('');
    setIsCreating(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) {
      setFormError('Directive title cannot be empty.');
      return;
    }
    if (title.trim().length > 120) {
      setFormError('Directive title must be 120 characters or fewer.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        difficulty,
        attribute,
        due_date: dueDate || null,
      };
      if (editingMissionId) {
        await updateMission(editingMissionId, payload);
      } else {
        await createMission(payload);
      }
      resetForm();
    } catch (err) {
      setFormError(err.message || (editingMissionId ? 'Failed to update mission.' : 'Failed to dispatch mission.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Filter tabs & Dispatch button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0D121F] p-4 border border-[#223254] cyber-cut-sm">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilter('active')}
            aria-pressed={filter === 'active'}
            className={`px-3 py-1.5 text-xs font-telemetry uppercase tracking-wider font-semibold cursor-pointer transition-all ${
              filter === 'active'
                ? 'bg-[#00F0FF] text-[#07090E] font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1A253D]'
            }`}
          >
            Active Directives ({missions.filter((m) => m.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            aria-pressed={filter === 'completed'}
            className={`px-3 py-1.5 text-xs font-telemetry uppercase tracking-wider font-semibold cursor-pointer transition-all ${
              filter === 'completed'
                ? 'bg-[#00F0FF] text-[#07090E] font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1A253D]'
            }`}
          >
            Completed ({missions.filter((m) => m.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={`px-3 py-1.5 text-xs font-telemetry uppercase tracking-wider font-semibold cursor-pointer transition-all ${
              filter === 'all'
                ? 'bg-[#00F0FF] text-[#07090E] font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1A253D]'
            }`}
          >
            All Logs ({missions.length})
          </button>
        </div>

        <CyberButton
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => (isCreating ? resetForm() : setIsCreating(true))}
        >
          Dispatch New Mission
        </CyberButton>
      </div>

      {/* Dispatch/Edit Mission Form Panel */}
      {isCreating && (
        <CyberCard glow glowColor="cyan" className="p-6 border-l-4 border-l-[#00F0FF]">
          <div className="flex items-center justify-between border-b border-[#223254] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#00F0FF]" />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                {editingMissionId ? 'Amend Mission Protocol' : 'Initialize Mission Protocol'}
              </h3>
            </div>
            <button
              onClick={resetForm}
              aria-label="Close mission form"
              className="text-[#94A3B8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div role="alert" className="mb-4 p-2.5 bg-[#FF0055]/15 border border-[#FF0055]/40 text-xs text-[#FF85A2] font-telemetry">
              {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="mission-title" className="block text-xs font-telemetry uppercase tracking-wider text-[#94A3B8] mb-1">
                Mission Directive *
              </label>
              <input
                id="mission-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Debug authentication microservice, Hit 10km run..."
                className="w-full bg-[#07090E] border border-[#223254] focus:border-[#00F0FF] px-3 py-2 text-sm text-[#E2E8F0] outline-none font-sans"
                maxLength={120}
                required
              />
            </div>

            <div>
              <label htmlFor="mission-description" className="block text-xs font-telemetry uppercase tracking-wider text-[#94A3B8] mb-1">
                Briefing / Notes (Optional)
              </label>
              <textarea
                id="mission-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key sub-vectors, deliverables, or objectives..."
                className="w-full bg-[#07090E] border border-[#223254] focus:border-[#00F0FF] px-3 py-2 text-sm text-[#E2E8F0] outline-none font-sans h-20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Difficulty Selector */}
              <div>
                <label htmlFor="mission-difficulty" className="block text-xs font-telemetry uppercase tracking-wider text-[#94A3B8] mb-1">
                  Threat / Difficulty Tier
                </label>
                <select
                  id="mission-difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-[#07090E] border border-[#223254] focus:border-[#00F0FF] px-3 py-2 text-sm text-[#E2E8F0] outline-none font-telemetry uppercase"
                >
                  <option value="trivial">Trivial (+5 XP, +2 Credits)</option>
                  <option value="easy">Easy (+10 XP, +5 Credits)</option>
                  <option value="medium">Medium (+20 XP, +10 Credits)</option>
                  <option value="hard">Hard (+35 XP, +18 Credits)</option>
                  <option value="epic">Epic (+60 XP, +35 Credits)</option>
                </select>
              </div>

              {/* Target Attribute */}
              <div>
                <label htmlFor="mission-attribute" className="block text-xs font-telemetry uppercase tracking-wider text-[#94A3B8] mb-1">
                  Neural Attribute
                </label>
                <select
                  id="mission-attribute"
                  value={attribute}
                  onChange={(e) => setAttribute(e.target.value)}
                  className="w-full bg-[#07090E] border border-[#223254] focus:border-[#00F0FF] px-3 py-2 text-sm text-[#E2E8F0] outline-none font-telemetry"
                >
                  <option value="Intellect">Intellect (Brain / Code / Study)</option>
                  <option value="Strength">Strength (Physical / Health)</option>
                  <option value="Discipline">Discipline (Habits / Focus)</option>
                  <option value="Creativity">Creativity (Art / Writing)</option>
                  <option value="General">General Operations</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="mission-due-date" className="block text-xs font-telemetry uppercase tracking-wider text-[#94A3B8] mb-1">
                  Target Due Date (Optional)
                </label>
                <input
                  id="mission-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-[#07090E] border border-[#223254] focus:border-[#00F0FF] px-3 py-2 text-sm text-[#E2E8F0] outline-none font-sans"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#223254]">
              <CyberButton variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </CyberButton>
              <CyberButton
                type="submit"
                variant="primary"
                size="sm"
                disabled={submitting}
              >
                {submitting
                  ? editingMissionId
                    ? 'Updating...'
                    : 'Encrypting...'
                  : editingMissionId
                  ? 'Save Amendment'
                  : 'Authorize Mission'}
              </CyberButton>
            </div>
          </form>
        </CyberCard>
      )}

      {/* Loading Skeleton */}
      {loadingMissions ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-[#0D121F] border border-[#223254] animate-pulse cyber-cut-sm flex items-center justify-between px-6"
            >
              <div className="space-y-2">
                <div className="w-48 h-4 bg-[#1A253D] rounded" />
                <div className="w-24 h-3 bg-[#131B2E] rounded" />
              </div>
              <div className="w-20 h-6 bg-[#1A253D] rounded" />
            </div>
          ))}
        </div>
      ) : filteredMissions.length === 0 ? (
        /* Empty State: Invitation to action, in-world tone */
        <div className="p-12 text-center border border-dashed border-[#223254] bg-[#0D121F]/40 cyber-cut space-y-4">
          <div className="w-12 h-12 mx-auto bg-[#07090E] border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF]">
            <Crosshair className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-white uppercase tracking-wider">
              No Active Directives Detected
            </h4>
            <p className="text-xs text-[#94A3B8] font-sans max-w-sm mx-auto mt-1">
              Your mission queue is currently clear, Operative. Dispatch a new objective to begin earning Uplink XP and Credits.
            </p>
          </div>
          <CyberButton variant="secondary" size="sm" onClick={() => { resetForm(); setIsCreating(true); }}>
            Initialize First Directive
          </CyberButton>
        </div>
      ) : (
        /* Mission Card Queue */
        <div className="space-y-3">
          {filteredMissions.map((mission) => {
            const isCompleted = mission.status === 'completed';
            const diffConfig = DIFFICULTY_CONFIG[mission.difficulty] || DIFFICULTY_CONFIG.medium;

            return (
              <div
                key={mission.id}
                className={`relative group bg-[#0D121F] border transition-all duration-200 cyber-cut-sm p-4 flex items-center justify-between gap-4 ${
                  isCompleted
                    ? 'border-[#223254]/50 opacity-65 bg-[#0A0E17]/60'
                    : 'border-[#223254] hover:border-[#00F0FF]/70 hover:shadow-[0_0_15px_rgba(0,240,255,0.08)]'
                }`}
              >
                {/* Checkbox Trigger (Optimistic Execution) */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => !isCompleted && completeMission(mission.id)}
                    disabled={isCompleted}
                    aria-label={`Complete mission: ${mission.title}`}
                    className={`mt-0.5 transition-transform cursor-pointer disabled:cursor-default ${
                      isCompleted
                        ? 'text-[#00FF9D]'
                        : 'text-[#64748B] hover:text-[#00F0FF] hover:scale-110'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#00FF9D]" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm font-semibold tracking-wide truncate ${
                          isCompleted ? 'line-through text-[#64748B]' : 'text-[#E2E8F0]'
                        }`}
                      >
                        {mission.title}
                      </h4>
                      <CyberBadge variant={diffConfig.badge}>
                        {diffConfig.label}
                      </CyberBadge>
                      <CyberBadge variant="slate">{mission.attribute}</CyberBadge>
                    </div>

                    {mission.description && (
                      <p className="text-xs text-[#94A3B8] mt-1 line-clamp-2 font-sans">
                        {mission.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-[11px] font-telemetry text-[#64748B]">
                      <span className="flex items-center gap-1 text-[#00F0FF]">
                        <Zap className="w-3 h-3" />
                        +{mission.xp_reward} XP
                      </span>
                      <span className="flex items-center gap-1 text-[#FFB800]">
                        <Coins className="w-3 h-3" />
                        +{mission.credit_reward ?? mission.gold_reward ?? 5} CREDITS
                      </span>
                      {mission.due_date && (
                        <span className="flex items-center gap-1 text-[#94A3B8]">
                          <Calendar className="w-3 h-3" />
                          {mission.due_date}
                        </span>
                      )}
                      {isCompleted && mission.completed_at && (
                        <span className="text-[#00FF9D]">
                          Uplinked:{' '}
                          {new Date(mission.completed_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mission Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  {!isCompleted && (
                    <button
                      onClick={() => openEditForm(mission)}
                      title="Amend Directive"
                      aria-label={`Edit mission: ${mission.title}`}
                      className="p-1.5 text-[#64748B] hover:text-[#00F0FF] transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMission(mission.id)}
                    title="Purge Directive"
                    aria-label={`Delete mission: ${mission.title}`}
                    className="p-1.5 text-[#64748B] hover:text-[#FF0055] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
