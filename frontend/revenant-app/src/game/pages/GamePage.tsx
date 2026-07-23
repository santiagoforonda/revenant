import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
import { useAuthStore } from "../../auth/store/auth-store";
import { eventBus } from "../events";
import { bootstrapService } from "../services/BootstrapService";

export const GamePage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSessionExpired = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    eventBus.on("SESSION_EXPIRED", handleSessionExpired);

    return () => {
      eventBus.off("SESSION_EXPIRED", handleSessionExpired);
    };
  }, [handleSessionExpired]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/", { replace: true });
      return;
    }

    if (gameRef.current || !containerRef.current) {
      return;
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
      backgroundColor: "#321F28",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameRef.current = new Phaser.Game(config);

    if (user) {
      eventBus.emit("GAME_INITIALIZED", user);
      bootstrapService.initialize(user);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [isAuthenticated, navigate, user]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className="w-screen h-screen bg-[#321F28] flex items-center justify-center"
      aria-label="Game area"
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
