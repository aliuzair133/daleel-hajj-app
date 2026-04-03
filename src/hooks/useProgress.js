import { useState, useEffect } from 'react';
import { getCompletedStepIds, markStepComplete, unmarkStep } from '../utils/db';
import ritualsData from '../data/rituals.json';

export function useProgress() {
  const [completedIds, setCompletedIds] = useState(new Set());

  useEffect(() => {
    getCompletedStepIds().then(setCompletedIds);
  }, []);

  async function toggleStep(stepId) {
    if (completedIds.has(stepId)) {
      await unmarkStep(stepId);
      setCompletedIds(prev => { const n = new Set(prev); n.delete(stepId); return n; });
    } else {
      await markStepComplete(stepId);
      setCompletedIds(prev => new Set([...prev, stepId]));
    }
  }

  const totalSteps = ritualsData.days.reduce((sum, day) => sum + day.steps.length, 0);
  const completedCount = completedIds.size;

  return { completedIds, toggleStep, totalSteps, completedCount };
}
