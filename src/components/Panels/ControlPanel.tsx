import {
  Activity,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  StepForward,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { EvaluationStrategy, Hyperparams } from "../../types/rl";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { Slider } from "../common/Slider";

interface ControlPanelProps {
  hyperparams: Hyperparams;
  speedMs: number;
  isAutoTraining: boolean;
  isEvaluating: boolean;
  evaluationStrategy: EvaluationStrategy;
  soundEnabled: boolean;
  onReset: () => void;
  onTrainStep: () => void;
  onTrainEpisode: () => void;
  onTrainBatch: () => void;
  onToggleAuto: () => void;
  onEvaluateGreedy: () => void;
  onEvaluateNonGreedy: () => void;
  onToggleSound: () => void;
  onHyperparamChange: <K extends keyof Hyperparams>(key: K, value: Hyperparams[K]) => void;
  onSpeedChange: (value: number) => void;
}

export function ControlPanel({
  hyperparams,
  speedMs,
  isAutoTraining,
  isEvaluating,
  evaluationStrategy,
  soundEnabled,
  onReset,
  onTrainStep,
  onTrainEpisode,
  onTrainBatch,
  onToggleAuto,
  onEvaluateGreedy,
  onEvaluateNonGreedy,
  onToggleSound,
  onHyperparamChange,
  onSpeedChange,
}: ControlPanelProps) {
  return (
    <Card title="Training Control" eyebrow="Simulator">
      <div className="control-grid">
        <Button icon={<RotateCcw size={17} />} onClick={onReset}>
          Reset
        </Button>
        <Button icon={<StepForward size={17} />} onClick={onTrainStep} variant="primary">
          Train one step
        </Button>
        <Button icon={<Activity size={17} />} onClick={onTrainEpisode}>
          Train one episode
        </Button>
        <Button icon={<FastForward size={17} />} onClick={onTrainBatch}>
          Train 50 episodes
        </Button>
        <Button icon={isAutoTraining ? <Pause size={17} /> : <Play size={17} />} onClick={onToggleAuto} variant="primary">
          {isAutoTraining ? "Pause" : "Auto train"}
        </Button>
        <div className="eval-button-pair">
          <Button
            icon={<Target size={15} />}
            onClick={onEvaluateGreedy}
            variant={isEvaluating && evaluationStrategy === "greedy" ? "primary" : "secondary"}
          >
            Greedy
          </Button>
          <Button
            icon={<Shuffle size={15} />}
            onClick={onEvaluateNonGreedy}
            variant={isEvaluating && evaluationStrategy === "non_greedy" ? "primary" : "secondary"}
          >
            Non-greedy
          </Button>
        </div>
        <Button
          icon={soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          onClick={onToggleSound}
          variant={soundEnabled ? "primary" : "secondary"}
          className="sound-toggle"
        >
          {soundEnabled ? "Sound on" : "Sound off"}
        </Button>
      </div>

      <div className="slider-stack">
        <Slider
          label="epsilon"
          description="Controls exploration in behavior policy mu. Higher values make training actions more random and collect more diverse experience."
          value={hyperparams.epsilon}
          min={0}
          max={0.8}
          step={0.05}
          onChange={(value) => onHyperparamChange("epsilon", value)}
        />
        <Slider
          label="temperature"
          description="Controls how sharp target policy pi is after softmax over Q-values. Lower is greedier; higher spreads probability across actions."
          value={hyperparams.temperature}
          min={0.1}
          max={2}
          step={0.05}
          onChange={(value) => onHyperparamChange("temperature", value)}
        />
        <Slider
          label="rho max"
          description="Caps the importance sampling ratio rho so off-policy updates do not become too large or unstable."
          value={hyperparams.rhoMax}
          min={1}
          max={10}
          step={0.5}
          onChange={(value) => onHyperparamChange("rhoMax", value)}
        />
        <Slider
          label="speed"
          description="Controls animation and auto-step interval. Lower milliseconds means the demo runs faster."
          value={speedMs}
          min={120}
          max={1200}
          step={40}
          suffix="ms"
          onChange={onSpeedChange}
        />
      </div>
    </Card>
  );
}
