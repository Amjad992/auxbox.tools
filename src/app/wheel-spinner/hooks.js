'use client';
import {useCallback, useEffect, useRef, useState} from 'react';
import {
  pickWinnerIndex,
  quickPickSchedule,
  targetRotationFor,
} from './utils';
import {
  PRESENTATIONS,
  QUICK_PICK_DURATION_MS,
  QUICK_PICK_STEPS,
  SPIN_DURATION_MS,
  SPIN_EXTRA_TURNS,
} from './constants';

/**
 * Picker animation hook. Owns the in-progress state (winner, highlight,
 * rotation, isRunning) and exposes a single `pick(mode, entries)` action.
 *
 * - Quick Pick: drives a setTimeout chain off `quickPickSchedule`.
 * - Spin Wheel: sets the target rotation and waits for the SVG transition
 *   to end (or a safety timeout, in case `transitionend` doesn't fire — the
 *   timeout matches the CSS duration with a small buffer).
 *
 * The hook itself doesn't mutate the entries — the page reacts to the
 * `winner` field and applies "remove after pick" if that toggle is on.
 */
export function usePicker() {
  const [winnerIndex, setWinnerIndex] = useState(null);
  const [winnerLabel, setWinnerLabel] = useState(null);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  // Tracks whether the wheel SVG should transition the rotation or jump.
  const [isSpinning, setIsSpinning] = useState(false);

  // setTimeout id for the Quick Pick chain so we can cancel on unmount.
  const timerRef = useRef(null);
  // Safety timer for the spin (in case transitionend doesn't fire in jsdom).
  const spinSafetyRef = useRef(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (spinSafetyRef.current !== null) {
      clearTimeout(spinSafetyRef.current);
      spinSafetyRef.current = null;
    }
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  const reset = useCallback(() => {
    cancel();
    setWinnerIndex(null);
    setWinnerLabel(null);
    setHighlightIndex(null);
    setIsRunning(false);
    setIsSpinning(false);
  }, [cancel]);

  const runQuickPick = useCallback(
    (entries, winner) => {
      const schedule = quickPickSchedule(
        entries.length,
        winner,
        QUICK_PICK_DURATION_MS,
        QUICK_PICK_STEPS
      );

      const runStep = (k) => {
        if (k >= schedule.length) {
          // Final state already set by the previous step.
          setIsRunning(false);
          setWinnerIndex(winner);
          setWinnerLabel(entries[winner]);
          timerRef.current = null;
          return;
        }
        const step = schedule[k];
        timerRef.current = setTimeout(() => {
          setHighlightIndex(step.index);
          if (k === schedule.length - 1) {
            // Last highlight is the winner — finalise on the next tick so
            // screen-reader users hear the announcement after the snap.
            setIsRunning(false);
            setWinnerIndex(winner);
            setWinnerLabel(entries[winner]);
            timerRef.current = null;
          } else {
            runStep(k + 1);
          }
        }, step.delay);
      };

      runStep(0);
    },
    []
  );

  const runSpinWheel = useCallback(
    (entries, winner) => {
      const target = targetRotationFor(
        winner,
        entries.length,
        SPIN_EXTRA_TURNS
      );
      // Step 1: ensure we start without a transition so the new value is the
      // "from" state. Then on the next frame, enable transition + set target.
      setIsSpinning(false);
      setRotation(0);
      // Use a microtask + a short timeout so React commits the non-spinning
      // rotation=0 first, then we kick off the transition.
      timerRef.current = setTimeout(() => {
        setIsSpinning(true);
        setRotation(target);
        // Safety net: announce the winner after SPIN_DURATION_MS even if
        // transitionend never fires (e.g. in jsdom).
        spinSafetyRef.current = setTimeout(() => {
          setIsRunning(false);
          setIsSpinning(false);
          setWinnerIndex(winner);
          setWinnerLabel(entries[winner]);
          spinSafetyRef.current = null;
        }, SPIN_DURATION_MS + 100);
        timerRef.current = null;
      }, 20);
    },
    []
  );

  /**
   * Kick off a pick. Returns the picked winner immediately so the caller
   * can apply "remove after pick" *after* the announcement (the caller
   * also receives `winnerIndex` once the animation finishes).
   */
  const pick = useCallback(
    (mode, entries) => {
      if (isRunning) return null;
      if (!Array.isArray(entries) || entries.length < 1) return null;

      const winner = pickWinnerIndex(entries.length);
      cancel();
      setWinnerIndex(null);
      setWinnerLabel(null);
      setHighlightIndex(null);
      setIsRunning(true);

      // Degenerate single-entry case (Pick-multiple "Pick last"): no
      // animation — announce immediately on the next tick so the live region
      // still fires the event.
      if (entries.length === 1) {
        timerRef.current = setTimeout(() => {
          setHighlightIndex(0);
          setIsRunning(false);
          setWinnerIndex(0);
          setWinnerLabel(entries[0]);
          timerRef.current = null;
        }, 0);
        return winner;
      }

      if (mode === PRESENTATIONS.WHEEL) {
        runSpinWheel(entries, winner);
      } else {
        runQuickPick(entries, winner);
      }
      return winner;
    },
    [cancel, isRunning, runQuickPick, runSpinWheel]
  );

  // Called by the SVG <g> on transitionend — finalises the winner without
  // waiting for the safety timer.
  const handleSpinTransitionEnd = useCallback(
    (entries, winner) => {
      if (spinSafetyRef.current !== null) {
        clearTimeout(spinSafetyRef.current);
        spinSafetyRef.current = null;
      }
      setIsRunning(false);
      setIsSpinning(false);
      setWinnerIndex(winner);
      setWinnerLabel(entries[winner]);
    },
    []
  );

  return {
    winnerIndex,
    winnerLabel,
    highlightIndex,
    rotation,
    isRunning,
    isSpinning,
    pick,
    reset,
    handleSpinTransitionEnd,
  };
}
