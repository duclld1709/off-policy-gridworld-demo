import { CircleHelp } from "lucide-react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description?: string;
  suffix?: string;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step, description, suffix = "", onChange }: SliderProps) {
  return (
    <label className="slider-row">
      <span className="slider-label">
        <span className="slider-label-text">
          {label}
          {description && (
            <span className="info-tooltip" tabIndex={0} aria-label={description}>
              <CircleHelp size={14} />
              <span className="tooltip-bubble">{description}</span>
            </span>
          )}
        </span>
        <strong>
          {value}
          {suffix}
        </strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
