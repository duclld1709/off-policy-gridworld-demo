import { useCallback, useEffect, useRef, useState } from "react";
import { BrainCircuit, Database, FastForward, Sparkles, X } from "lucide-react";
import { GridWorld } from "./components/GridWorld/GridWorld";
import { Button } from "./components/common/Button";
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

const RAPID_BATCH_CLICK_LIMIT = 3;
const RAPID_BATCH_CLICK_WINDOW_MS = 2000;

function App() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showBulkTrainPrompt, setShowBulkTrainPrompt] = useState(false);
  const {
    controller,
    grid,
    canEditTraps,
    hyperparams,
    speedMs,
    metrics,
    displayState,
    reset,
    updateHyperparam,
    setSpeedMs,
    moveTrap,
    toggleTrap,
    trainOneStep,
    trainEpisodes,
    toggleAutoTrain,
    evaluateTargetPolicy,
  } = useTrainingController();
  const { playSound, unlockAudio } = useGameAudio(soundEnabled);
  const previousTrainingTransitionRef = useRef<Transition | undefined>(undefined);
  const previousEvaluationKeyRef = useRef<string | undefined>(undefined);
  const rapidBatchClickRef = useRef({ count: 0, lastClickAt: 0 });

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

    previousTrainingTransitionRef.current = transition;
    playTransitionSound(transition);
  }, [controller.lastTransition, playTransitionSound]);

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

  const handleTrainStep = useCallback(() => {
    unlockAudio();
    trainOneStep();
  }, [trainOneStep, unlockAudio]);

  const handleTrainEpisode = useCallback(() => {
    unlockAudio();
    trainEpisodes(1);
  }, [trainEpisodes, unlockAudio]);

  const handleTrainBatch = useCallback(() => {
    unlockAudio();
    const now = Date.now();
    const rapidClickState = rapidBatchClickRef.current;

    rapidClickState.count =
      now - rapidClickState.lastClickAt <= RAPID_BATCH_CLICK_WINDOW_MS ? rapidClickState.count + 1 : 1;
    rapidClickState.lastClickAt = now;

    if (rapidClickState.count >= RAPID_BATCH_CLICK_LIMIT) {
      rapidClickState.count = 0;
      setShowBulkTrainPrompt(true);
      playSound("toggle");
      return;
    }

    trainEpisodes(50);
  }, [playSound, trainEpisodes, unlockAudio]);

  const closeBulkTrainPrompt = useCallback(() => {
    rapidBatchClickRef.current = { count: 0, lastClickAt: 0 };
    setShowBulkTrainPrompt(false);
    playSound("toggle");
  }, [playSound]);

  const confirmBulkTrain = useCallback(() => {
    unlockAudio();
    rapidBatchClickRef.current = { count: 0, lastClickAt: 0 };
    setShowBulkTrainPrompt(false);
    playSound("start");
    trainEpisodes(1000);
  }, [playSound, trainEpisodes, unlockAudio]);

  const continueBatchTrain = useCallback(() => {
    unlockAudio();
    rapidBatchClickRef.current = { count: 0, lastClickAt: 0 };
    setShowBulkTrainPrompt(false);
    trainEpisodes(50);
  }, [trainEpisodes, unlockAudio]);

  const handleToggleAuto = useCallback(() => {
    playSound(controller.isAutoTraining ? "toggle" : "start");
    toggleAutoTrain();
  }, [controller.isAutoTraining, playSound, toggleAutoTrain]);

  const handleEvaluate = useCallback((strategy: EvaluationStrategy) => {
    playSound("start");
    previousEvaluationKeyRef.current = undefined;
    evaluateTargetPolicy(strategy);
  }, [evaluateTargetPolicy, playSound]);

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
          <h1>Gridworld 5x5</h1>
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
            canEditTraps={canEditTraps}
            onMoveTrap={moveTrap}
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
          title="Behavior Policy μ"
          kind="behavior"
          policy={controller.learner.behaviorPolicy}
          currentState={displayState.currentState}
          grid={grid}
          mode={displayState.mode}
        />
        <PolicyPanel
          title="Target Policy π"
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

      {showBulkTrainPrompt && (
        <div className="modal-backdrop" role="presentation">
          <div
            aria-labelledby="bulk-train-title"
            aria-modal="true"
            className="confirm-modal"
            role="dialog"
          >
            <button className="modal-close" type="button" aria-label="Close" onClick={closeBulkTrainPrompt}>
              <X size={18} />
            </button>
            <div className="modal-icon">
              <FastForward size={22} />
            </div>
            <h2 id="bulk-train-title">Train 1000 episodes?</h2>
            <p>
              You clicked Train 50 episodes several times in a row. Run a larger batch now, or keep this click at 50
              episodes.
            </p>
            <div className="modal-actions">
              <Button variant="primary" icon={<FastForward size={17} />} onClick={confirmBulkTrain}>
                Train 1000
              </Button>
              <Button onClick={continueBatchTrain}>Train 50</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
