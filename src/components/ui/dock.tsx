"use client";

import { cn } from "@/lib/utils";
import { motion, MotionValue, useMotionValue, useSpring, useTransform } from "framer-motion";
import React, { useRef } from "react";

export interface DockProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
  direction?: "top" | "middle" | "bottom";
  distance?: number;
  magnification?: number;
}

export interface DockIconProps {
  size?: number;
  magnification?: number;
  distance?: number;
  children?: React.ReactNode;
  className?: string;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

export function DockIcon({
  size = 48,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  children,
  className,
}: DockIconProps) {
  const ref = useRef<HTMLDivElement>(null);

  const distanceCalc = useTransform(
    useMotionValue(0),
    [-distance, 0, distance],
    [40, magnification, 40]
  );

  const widthTransform = useTransform(distanceCalc, (value) => value);
  const heightTransform = useTransform(distanceCalc, (value) => value);

  const widthPX = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightPX = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const width = useTransform(widthPX, (value) => `${value}px`);
  const height = useTransform(heightPX, (value) => `${value}px`);

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      whileHover={{ scale: 1.1 }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full bg-gray-200 dark:bg-slate-800",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function Dock({
  className,
  children,
  direction = "bottom",
  distance = DEFAULT_DISTANCE,
  magnification = DEFAULT_MAGNIFICATION,
  ...props
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  const renderChildren = () => {
    return React.Children.map(children, (child: any, index) => {
      return React.cloneElement(child, {
        ...child.props,
        magnification,
        distance,
        mouseX,
        key: index,
      });
    });
  };

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      {...(props as any)}
      className={cn(
        "mx-auto flex h-16 items-end gap-4 rounded-2xl border bg-white/10 px-4 pb-3 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:border-white/20 dark:bg-black/10 dark:supports-[backdrop-filter]:bg-black/60",
        {
          "items-start pt-3": direction === "top",
          "items-center py-3": direction === "middle",
          "items-end pb-3": direction === "bottom",
        },
        className
      )}
    >
      {renderChildren()}
    </motion.div>
  );
} 