"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

interface AnimatedValueProps {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}

export function AnimatedValue({
  value,
  format,
  duration = 0.7,
  className,
}: AnimatedValueProps) {
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    const animation = animate(currentValue, value, {
      duration,
      onUpdate: (latest) => setCurrentValue(latest),
    });

    return () => animation.stop();
  }, [value, duration]);

  return (
    <span className={className}>
      {format ? format(currentValue) : currentValue.toFixed(0)}
    </span>
  );
}
