"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React, { forwardRef, useRef } from "react";

export interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLElement>; // Container ref
  fromRef: React.RefObject<HTMLElement>;
  toRef: React.RefObject<HTMLElement>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export const AnimatedBeam = forwardRef<SVGSVGElement, AnimatedBeamProps>(
  (
    {
      className,
      containerRef,
      fromRef,
      toRef,
      curvature = 0,
      reverse = false,
      duration = Math.random() * 3 + 4,
      delay = 0,
      pathColor = "gray",
      pathWidth = 2,
      pathOpacity = 0.2,
      gradientStartColor = "#ff0080",
      gradientStopColor = "#0080ff",
      startXOffset = 0,
      startYOffset = 0,
      endXOffset = 0,
      endYOffset = 0,
    },
    ref,
  ) => {
    const id = React.useId();

    return (
      <svg
        ref={ref}
        fill="none"
        width="100%"
        height="100%"
        className={cn(
          "pointer-events-none absolute left-0 top-0 transform-gpu stroke-2",
          className,
        )}
        viewBox={`0 0 ${containerRef.current?.offsetWidth || 100} ${
          containerRef.current?.offsetHeight || 100
        }`}
      >
        <defs>
          <linearGradient
            className={`transform-gpu ${reverse ? "rotate-180" : ""}`}
            id={id}
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={gradientStartColor} stopOpacity="0" />
            <stop stopColor={gradientStartColor} />
            <stop offset="32.5%" stopColor={gradientStopColor} />
            <stop
              offset="100%"
              stopColor={gradientStopColor}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        <motion.path
          d={getSVGPath(
            containerRef,
            fromRef,
            toRef,
            curvature,
            startXOffset,
            startYOffset,
            endXOffset,
            endYOffset,
          )}
          stroke={pathColor}
          strokeWidth={pathWidth}
          strokeOpacity={pathOpacity}
          strokeLinecap="round"
        />
        <motion.path
          d={getSVGPath(
            containerRef,
            fromRef,
            toRef,
            curvature,
            startXOffset,
            startYOffset,
            endXOffset,
            endYOffset,
          )}
          stroke={`url(#${id})`}
          strokeWidth={pathWidth}
          strokeOpacity="1"
          strokeLinecap="round"
          initial={{
            strokeDasharray: "0 100%",
          }}
          animate={{
            strokeDasharray: ["0 100%", "50% 50%", "0 100%"],
          }}
          transition={{
            duration,
            delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </svg>
    );
  },
);

AnimatedBeam.displayName = "AnimatedBeam";

function getSVGPath(
  containerRef: React.RefObject<HTMLElement>,
  fromRef: React.RefObject<HTMLElement>,
  toRef: React.RefObject<HTMLElement>,
  curvature: number,
  startXOffset: number,
  startYOffset: number,
  endXOffset: number,
  endYOffset: number,
): string {
  const containerRect = containerRef.current?.getBoundingClientRect();
  const fromRect = fromRef.current?.getBoundingClientRect();
  const toRect = toRef.current?.getBoundingClientRect();

  if (!containerRect || !fromRect || !toRect) {
    return "";
  }

  const startX =
    fromRect.left - containerRect.left + fromRect.width / 2 + startXOffset;
  const startY =
    fromRect.top - containerRect.top + fromRect.height / 2 + startYOffset;
  const endX =
    toRect.left - containerRect.left + toRect.width / 2 + endXOffset;
  const endY = toRect.top - containerRect.top + toRect.height / 2 + endYOffset;

  const controlX = startX + (endX - startX) * curvature;
  const controlY = startY + (endY - startY) * curvature;

  return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
} 