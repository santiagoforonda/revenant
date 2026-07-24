import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/auth/hooks/useReducedMotion";
import { useRippleEffect } from "@/auth/hooks/useRippleEffect";
import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<typeof Button>;

interface InteractiveButtonProps extends ButtonProps {
  glowColor?: string;
  glowOpacity?: number;
  glowSpread?: number;
  scaleOnPress?: number;
  rippleDuration?: number;
}

/**
 * A shadcn/ui Button wrapper with interactive glow, scale, and ripple effects.
 *
 * - Hover: box-shadow glow with configurable color/opacity/spread
 * - Press (mousedown/touchstart): scales down with 100ms transition
 * - Release (mouseup/touchend): radial ripple expanding from press point
 * - Reduced motion: subtle background color change on hover only
 *
 * Forwards all shadcn/ui Button props.
 */
export function InteractiveButton({
  glowColor = "#E1DCC9",
  glowOpacity = 0.4,
  glowSpread = 6,
  scaleOnPress = 0.96,
  rippleDuration = 400,
  className,
  style,
  children,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
  ...props
}: InteractiveButtonProps) {
  const reducedMotion = useReducedMotion();
  const { ripples, triggerRipple } = useRippleEffect({ duration: rippleDuration });
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!reducedMotion) {
        setIsPressed(true);
      }
      onMouseDown?.(event);
    },
    [reducedMotion, onMouseDown]
  );

  const handleMouseUp = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!reducedMotion) {
        setIsPressed(false);
        triggerRipple(event);
      }
      onMouseUp?.(event);
    },
    [reducedMotion, triggerRipple, onMouseUp]
  );

  const handleMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setIsPressed(false);
      setIsHovered(false);
      onMouseLeave?.(event);
    },
    [onMouseLeave]
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLButtonElement>) => {
      if (!reducedMotion) {
        setIsPressed(true);
      }
      onTouchStart?.(event);
    },
    [reducedMotion, onTouchStart]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLButtonElement>) => {
      if (!reducedMotion) {
        setIsPressed(false);
        triggerRipple(event);
      }
      onTouchEnd?.(event);
    },
    [reducedMotion, triggerRipple, onTouchEnd]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  // Build dynamic inline styles for glow and scale
  const glowRgba = hexToRgba(glowColor, glowOpacity);
  const reducedMotionHoverBg = hexToRgba("#E1DCC9", 0.1);

  const dynamicStyle: React.CSSProperties = {
    ...style,
    position: "relative",
    overflow: "hidden",
    transition: reducedMotion ? "background-color 150ms" : "transform 100ms, box-shadow 200ms",
    transform: !reducedMotion && isPressed ? `scale(${scaleOnPress})` : "scale(1)",
    boxShadow:
      !reducedMotion && isHovered
        ? `0 0 ${glowSpread}px ${glowRgba}`
        : "none",
    backgroundColor:
      reducedMotion && isHovered ? reducedMotionHoverBg : undefined,
  };

  return (
    <Button
      className={cn(
        "bg-[#412D15] text-[#E1DCC9] hover:bg-[#412D15]",
        className
      )}
      style={dynamicStyle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {children}
      {!reducedMotion &&
        ripples.map((ripple) => (
          <span
            key={ripple.id}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: ripple.x,
              top: ripple.y,
              width: 0,
              height: 0,
              borderRadius: "50%",
              backgroundColor: hexToRgba("#E1DCC9", 0.4),
              transform: "translate(-50%, -50%) scale(0)",
              animation: `ripple-expand ${rippleDuration}ms ease-out forwards`,
              pointerEvents: "none",
            }}
          />
        ))}
    </Button>
  );
}

/**
 * Converts a hex color and opacity to an rgba string.
 */
function hexToRgba(hex: string, opacity: number): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
