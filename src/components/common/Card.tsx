import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}

export function Card({ title, eyebrow, children, className = "", right }: CardProps) {
  return (
    <section className={`card ${className}`}>
      {(title || eyebrow || right) && (
        <div className="card-header">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h2>{title}</h2>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
