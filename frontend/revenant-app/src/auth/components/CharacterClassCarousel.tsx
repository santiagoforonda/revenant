import { useState, useEffect, useCallback, useLayoutEffect, type KeyboardEvent } from "react";
import { GiPointySword } from "react-icons/gi";
import { useCarousel } from "../hooks/useCarousel";
import { useReducedMotion } from "@/auth/hooks/useReducedMotion";

import knightImg from "../../assets/characters/knight.png";
import magoImg from "../../assets/characters/mago.png";
import gladiadorImg from "../../assets/characters/gladiador.png";
import espadacinImg from "../../assets/characters/espadachin.png";

type CharacterClass = {
  id: string;
  label: string;
  imageSrc: string;
};

const CHARACTER_CLASSES: CharacterClass[] = [
  { id: "CABALLERO", label: "Caballero", imageSrc: knightImg },
  { id: "MAGO", label: "Mago", imageSrc: magoImg },
  { id: "GLADIADOR", label: "Gladiador", imageSrc: gladiadorImg },
  { id: "ESPADACHIN", label: "Espadachín", imageSrc: espadacinImg },
];

type CarouselProps = {
  value: string;
  onChange: (playerType: string) => void;
  error?: string;
};

export { CHARACTER_CLASSES };
export type { CarouselProps, CharacterClass };

export const CharacterClassCarousel = ({
  onChange,
  error,
}: CarouselProps) => {
  const { currentIndex, direction, isAnimating, goNext, goPrev, releaseAnimation } =
    useCarousel(CHARACTER_CLASSES.length);
  const reducedMotion = useReducedMotion();

  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  // Two-phase entrance animation:
  // Phase 1 (entered=false): card is positioned offscreen based on direction
  // Phase 2 (entered=true): card transitions to final centered position
  const [entered, setEntered] = useState(true);

  useLayoutEffect(() => {
    if (isAnimating && direction) {
      if (reducedMotion) {
        // Instant switch — no animation, release immediately
        setEntered(true);
        releaseAnimation();
        return;
      }
      setEntered(false);
      // Double rAF ensures the browser paints the initial offscreen position
      // before we trigger the transition to the final position
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setEntered(true);
        });
      });
    }
  }, [isAnimating, direction, currentIndex, reducedMotion, releaseAnimation]);

  const currentClass = CHARACTER_CLASSES[currentIndex];

  useEffect(() => {
    onChange(currentClass.id);
  }, [currentIndex, currentClass.id, onChange]);

  const handleImageError = useCallback((index: number) => {
    setImageError((prev) => ({ ...prev, [index]: true }));
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  // Compute transform/opacity for the card based on animation state
  const getCardTransform = (): string => {
    if (!isAnimating || !direction) {
      return "translateX(0) scale(1)";
    }
    if (!entered) {
      // Initial position: offscreen from the incoming direction
      const translateX = direction === "left" ? "100%" : "-100%";
      return `translateX(${translateX}) scale(0.95)`;
    }
    // Final position: centered
    return "translateX(0) scale(1)";
  };

  const getCardOpacity = (): number => {
    if (!isAnimating || !direction) return 1;
    if (!entered) return 0;
    return 1;
  };

  return (
    <div
      role="group"
      aria-label="character class selection"
      className="flex flex-col items-center gap-2"
    >
      {/* "Choose your destiny" label */}
      <p className="font-hand text-[#E1DCC9]/70 text-lg">
        Elije tu personaje
      </p>

      {/* Carousel viewport — focusable for keyboard navigation */}
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative w-full overflow-hidden flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#E1DCC9] rounded"
      >
        {/* Previous arrow */}
        <button
          type="button"
          onClick={goPrev}
          disabled={isAnimating}
          aria-label="Previous character class"
          className="flex-shrink-0 flex items-center justify-center w-[44px] h-[44px] text-[#E1DCC9]/60 hover:text-[#E1DCC9] transition-colors duration-150 disabled:opacity-40"
        >
          <GiPointySword
            size={24}
            className="rotate-90"
          />
        </button>

        {/* Active card with glow — animated slide/scale/opacity */}
        <div
          className="relative flex flex-col items-center justify-center mx-2"
          style={{
            transform: getCardTransform(),
            opacity: getCardOpacity(),
            transition: reducedMotion
              ? "none"
              : entered && isAnimating
                ? "transform 300ms ease-in-out, opacity 300ms ease-in-out"
                : "none",
          }}
          onTransitionEnd={releaseAnimation}
        >
          {/* Radial glow pseudo-element with glow-pulse on entrance */}
          <div
            className={`absolute inset-0 rounded-full pointer-events-none ${
              isAnimating && entered
                ? "animate-[glow-pulse_600ms_ease-in-out_1]"
                : ""
            }`}
            style={{
              background:
                "radial-gradient(circle, rgba(225,220,201,0.2) 0%, transparent 60%)",
            }}
          />

          {/* Character image */}
          <div className="relative w-32 h-32 md:w-64 md:h-64 flex items-center justify-center">
            {imageError[currentIndex] ? (
              <div
                className="w-32 h-32 md:w-64 md:h-64 rounded-full bg-[#412D15]/60 flex items-center justify-center"
                aria-label={`${currentClass.label} silhouette placeholder`}
              >
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 48 48"
                  fill="none"
                  className="opacity-60"
                >
                  <circle cx="24" cy="16" r="8" fill="#412D15" />
                  <path
                    d="M12 44c0-8 5.4-14 12-14s12 6 12 14"
                    fill="#412D15"
                  />
                </svg>
              </div>
            ) : (
              <img
                src={currentClass.imageSrc}
                alt={currentClass.label}
                className="w-32 h-32 md:w-64 md:h-64 object-contain"
                onError={() => handleImageError(currentIndex)}
              />
            )}
          </div>

          {/* Character name */}
          <span className="mt-2 text-[#E1DCC9] font-title text-xl">
            {currentClass.label}
          </span>
        </div>

        {/* Next arrow */}
        <button
          type="button"
          onClick={goNext}
          disabled={isAnimating}
          aria-label="Next character class"
          className="flex-shrink-0 flex items-center justify-center w-[44px] h-[44px] text-[#E1DCC9]/60 hover:text-[#E1DCC9] transition-colors duration-150 disabled:opacity-40"
        >
          <GiPointySword
            size={24}
            className="-rotate-90"
          />
        </button>
      </div>

      {/* Diamond dot indicators */}
      <div className="flex items-center gap-2 mt-1">
        {CHARACTER_CLASSES.map((charClass, index) => (
          <span
            key={charClass.id}
            className={`
              inline-block w-2 h-2 rotate-45 transition-all duration-200
              ${
                index === currentIndex
                  ? "bg-[#E1DCC9] shadow-[0_0_4px_rgba(225,220,201,0.6)]"
                  : "bg-[#412D15]"
              }
            `}
            aria-label={`Class ${index + 1} of ${CHARACTER_CLASSES.length}`}
            aria-current={index === currentIndex ? "true" : undefined}
          />
        ))}
      </div>

      {/* ARIA live region — announces current character class on change */}
      <span aria-live="polite" className="sr-only">
        {currentClass.label}
      </span>

      {/* Error message */}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
};
