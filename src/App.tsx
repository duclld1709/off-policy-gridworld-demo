import { useCallback, useEffect, useRef, useState } from "react";
import { BrainCircuit, ChevronDown, Database, FastForward, Sparkles } from "lucide-react";
import { GRID_SIZE_OPTIONS } from "./constants/grid";
import { GridWorld } from "./components/GridWorld/GridWorld";
import { ControlPanel } from "./components/Panels/ControlPanel";
import { StatusPanel } from "./components/Panels/StatusPanel";
import { PolicyPanel } from "./components/Panels/PolicyPanel";
import { ReplayBufferPanel } from "./components/Panels/ReplayBufferPanel";
import { ImportanceSamplingPanel } from "./components/Panels/ImportanceSamplingPanel";
import { ChartsPanel } from "./components/Panels/ChartsPanel";
import { WhatHappeningPanel } from "./components/Panels/WhatHappeningPanel";
import { useGameAudio } from "./hooks/useGameAudio";
import { useTrainingController } from "./hooks/useTrainingController";
import type { EvaluationStrategy, Transition } from "./types/rl";

const BULK_TRAIN_CHUNK_SIZE = 50;

function App() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isGridSizeMenuOpen, setIsGridSizeMenuOpen] = useState(false);
  const [bulkTrainingProgress, setBulkTrainingProgress] = useState<{ completed: number; total: number } | null>(null);
  const {
    controller,
    grid,
    gridSize,
    canEditTraps,
    hyperparams,
    speedMs,
    metrics,
    displayState,
    reset,
    updateGridSize,
    updateHyperparam,
    setSpeedMs,
    moveTrap,
    moveGoal,
    toggleTrap,
    trainOneStep,
    trainEpisodes,
    toggleAutoTrain,
    evaluateTargetPolicy,
  } = useTrainingController();
  const { playSound, unlockAudio } = useGameAudio(soundEnabled);
  const previousTrainingTransitionRef = useRef<Transition | undefined>(undefined);
  const previousEvaluationKeyRef = useRef<string | undefined>(undefined);

  const playTransitionSound = useCallback(
    (transition: Transition) => {
      if (transition.doneReason === "goal") {
        playSound("goal");
        return;
      }
      if (transition.doneReason === "trap") {
        playSound("trap");
        return;
      }
      if (transition.doneReason === "max_steps") {
        playSound("max_steps");
        return;
      }
      playSound(transition.reward <= -5 ? "wall" : "move");
    },
    [playSound],
  );

  useEffect(() => {
    const transition = controller.lastTransition;
    if (!transition || previousTrainingTransitionRef.current === transition) return;

    if (bulkTrainingProgress !== null) {
      previousTrainingTransitionRef.current = transition;
      return;
    }

    previousTrainingTransitionRef.current = transition;
    playTransitionSound(transition);
  }, [bulkTrainingProgress, controller.lastTransition, playTransitionSound]);

  useEffect(() => {
    if (displayState.mode !== "Evaluation" || displayState.currentStep === 0) return;

    const evaluationKey = [
      displayState.currentStep,
      displayState.currentState.row,
      displayState.currentState.col,
      displayState.doneReason,
      controller.lastReward ?? "none",
    ].join(":");

    if (previousEvaluationKeyRef.current === evaluationKey) return;
    previousEvaluationKeyRef.current = evaluationKey;

    if (displayState.doneReason === "goal") {
      playSound("goal");
      return;
    }
    if (displayState.doneReason === "trap") {
      playSound("trap");
      return;
    }
    if (displayState.doneReason === "max_steps") {
      playSound("max_steps");
      return;
    }
    playSound((controller.lastReward ?? 0) <= -5 ? "wall" : "move");
  }, [
    controller.lastReward,
    displayState.currentState.col,
    displayState.currentState.row,
    displayState.currentStep,
    displayState.doneReason,
    displayState.mode,
    playSound,
  ]);

  const handleReset = useCallback(() => {
    playSound("reset");
    previousTrainingTransitionRef.current = undefined;
    previousEvaluationKeyRef.current = undefined;
    reset();
  }, [playSound, reset]);

  const handleGridSizeSelect = useCallback(
    (nextGridSize: number) => {
      setIsGridSizeMenuOpen(false);
      if (nextGridSize === gridSize) return;
      previousTrainingTransitionRef.current = undefined;
      previousEvaluationKeyRef.current = undefined;
      playSound("reset");
      updateGridSize(nextGridSize);
    },
    [gridSize, playSound, updateGridSize],
  );

  const handleTrainStep = useCallback(() => {
    unlockAudio();
    trainOneStep();
  }, [trainOneStep, unlockAudio]);

  const handleTrainEpisode = useCallback(() => {
    unlockAudio();
    trainEpisodes(1);
  }, [trainEpisodes, unlockAudio]);

  const handleTrainBatch = useCallback(
    async (episodeCount: number) => {
      unlockAudio();

      if (episodeCount < 1000) {
        trainEpisodes(episodeCount);
        return;
      }

      setBulkTrainingProgress({ completed: 0, total: episodeCount });
      for (let trainedEpisodes = 0; trainedEpisodes < episodeCount; trainedEpisodes += BULK_TRAIN_CHUNK_SIZE) {
        const nextChunkSize = Math.min(BULK_TRAIN_CHUNK_SIZE, episodeCount - trainedEpisodes);
        trainEpisodes(nextChunkSize);
        setBulkTrainingProgress({ completed: trainedEpisodes + nextChunkSize, total: episodeCount });
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 0);
        });
      }
      setBulkTrainingProgress(null);
    },
    [trainEpisodes, unlockAudio],
  );

  const handleToggleAuto = useCallback(() => {
    playSound(controller.isAutoTraining ? "toggle" : "start");
    toggleAutoTrain();
  }, [controller.isAutoTraining, playSound, toggleAutoTrain]);

  const handleEvaluate = useCallback(
    (strategy: EvaluationStrategy) => {
      playSound("start");
      previousEvaluationKeyRef.current = undefined;
      evaluateTargetPolicy(strategy);
    },
    [evaluateTargetPolicy, playSound],
  );

  const handleEvaluateGreedy = useCallback(() => {
    handleEvaluate("greedy");
  }, [handleEvaluate]);

  const handleEvaluateNonGreedy = useCallback(() => {
    handleEvaluate("non_greedy");
  }, [handleEvaluate]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((current) => {
      if (!current) {
        unlockAudio();
      }
      return !current;
    });
  }, [unlockAudio]);

  return (
    <main className="app-shell">
      <header className="hero-bar">
        <div>
          <div className="kicker">
            <BrainCircuit size={18} />
            Off-policy reinforcement learning
          </div>
          <h1 className="hero-title">
            Gridworld
            <label className="sr-only" htmlFor="grid-size-select">
              Grid size
            </label>
            <span
              className="grid-size-select-shell"
              onBlur={(event) => {
                const nextTarget = event.relatedTarget as Node | null;
                if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                  setIsGridSizeMenuOpen(false);
                }
              }}
            >
              <button
                id="grid-size-select"
                type="button"
                className="grid-size-select"
                aria-haspopup="listbox"
                aria-expanded={isGridSizeMenuOpen}
                onClick={() => setIsGridSizeMenuOpen((current) => !current)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setIsGridSizeMenuOpen(false);
                  if (event.key === "ArrowDown") setIsGridSizeMenuOpen(true);
                }}
              >
                <span>{gridSize}x{gridSize}</span>
                <ChevronDown className="grid-size-select-icon" size={18} aria-hidden="true" />
              </button>
              {isGridSizeMenuOpen && (
                <div className="grid-size-menu" role="listbox" aria-label="Grid size">
                  {GRID_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`grid-size-option ${size === gridSize ? "grid-size-option-active" : ""}`}
                      role="option"
                      aria-selected={size === gridSize}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleGridSizeSelect(size)}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              )}
            </span>
          </h1>
        </div>
        <div className="hero-stats">
          <span>
            <Database size={16} />
            Buffer {controller.learner.replayBuffer.items.length}
          </span>
          <span>
            <Sparkles size={16} />
            Success {(metrics.successRate * 100).toFixed(0)}%
          </span>
        </div>
      </header>

      <section className="main-layout">
        <div className="world-column">
          <GridWorld
            currentState={displayState.currentState}
            trajectory={displayState.trajectory}
            doneReason={displayState.doneReason}
            speedMs={speedMs}
            grid={grid}
            lastAction={controller.lastAction}
            lastReward={controller.lastReward}
            canEditTraps={canEditTraps}
            onMoveTrap={moveTrap}
            onMoveGoal={moveGoal}
            onToggleTrap={toggleTrap}
          />
          <WhatHappeningPanel />
        </div>

        <div className="side-column">
          <ControlPanel
            hyperparams={hyperparams}
            speedMs={speedMs}
            isAutoTraining={controller.isAutoTraining}
            isEvaluating={controller.isEvaluating}
            evaluationStrategy={controller.evaluationStrategy}
            soundEnabled={soundEnabled}
            onReset={handleReset}
            onTrainStep={handleTrainStep}
            onTrainEpisode={handleTrainEpisode}
            onTrainBatch={handleTrainBatch}
            onToggleAuto={handleToggleAuto}
            onEvaluateGreedy={handleEvaluateGreedy}
            onEvaluateNonGreedy={handleEvaluateNonGreedy}
            onToggleSound={handleToggleSound}
            onHyperparamChange={updateHyperparam}
            onSpeedChange={setSpeedMs}
          />
          <StatusPanel
            mode={displayState.mode}
            episode={displayState.episode}
            currentStep={displayState.currentStep}
            currentState={displayState.currentState}
            lastAction={controller.lastAction}
            lastReward={controller.lastReward}
            doneReason={displayState.doneReason}
            evaluationStrategy={displayState.evaluationStrategy}
            totalReward={displayState.totalReward}
            replayBufferSize={controller.learner.replayBuffer.items.length}
            successRate={metrics.successRate}
            trapHitCount={metrics.trapHitCount}
            batchSummary={controller.batchSummary}
          />
        </div>
      </section>

      <section className="dashboard-grid">
        <PolicyPanel
          title="Behavior Policy mu"
          kind="behavior"
          policy={controller.learner.behaviorPolicy}
          currentState={displayState.currentState}
          grid={grid}
          mode={displayState.mode}
        />
        <PolicyPanel
          title="Target Policy pi"
          kind="target"
          policy={controller.learner.targetPolicy}
          currentState={displayState.currentState}
          grid={grid}
          mode={displayState.mode}
        />
        <ReplayBufferPanel
          replayBuffer={controller.learner.replayBuffer}
          targetPolicy={controller.learner.targetPolicy}
          hyperparams={hyperparams}
          sampledIds={controller.sampledIds}
          activeUpdateId={controller.lastUpdate?.transitionId}
        />
        <ImportanceSamplingPanel update={controller.lastUpdate} />
        <ChartsPanel points={metrics.metricPoints} />
      </section>

      {bulkTrainingProgress !== null && (
        <div className="modal-backdrop" role="presentation">
          <div aria-labelledby="bulk-training-title" aria-modal="true" className="confirm-modal" role="dialog">
            <div className="modal-icon">
              <FastForward size={22} />
            </div>
            <h2 id="bulk-training-title">Training {bulkTrainingProgress.total} episodes</h2>
            <div
              className="bulk-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((bulkTrainingProgress.completed / bulkTrainingProgress.total) * 100)}
            >
              <div
                className="bulk-progress-fill"
                style={{ width: `${(bulkTrainingProgress.completed / bulkTrainingProgress.total) * 100}%` }}
              />
            </div>
            <p>{bulkTrainingProgress.completed} / {bulkTrainingProgress.total} episodes</p>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
