import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Phaser from "phaser";
import { useAuthStore } from "@/auth/store/auth-store";
import { eventBus } from "../events";
import { bootstrapService } from "../services/BootstrapService";
import { MainScene } from "../scenes/MainScene";
import { PLAYER_TYPE_TO_CLASS, PlayerClass } from "../config/ClassSpriteRegistry";

export const GamePage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSessionExpired = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    navigate("/", { replace: true });
  }, [navigate]);

  const handleLogoutRequested = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    logout();
    navigate("/", { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    eventBus.on("SESSION_EXPIRED", handleSessionExpired);

    return () => {
      eventBus.off("SESSION_EXPIRED", handleSessionExpired);
    };
  }, [handleSessionExpired]);

  useEffect(() => {
    eventBus.on("LOGOUT_REQUESTED", handleLogoutRequested);

    return () => {
      eventBus.off("LOGOUT_REQUESTED", handleLogoutRequested);
    };
  }, [handleLogoutRequested]);

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
      backgroundColor: "#000000",
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

    // Resolve player class from backend typePlayer
    const playerClass = user?.typePlayer
      ? PLAYER_TYPE_TO_CLASS[user.typePlayer] ?? PlayerClass.Caballero
      : PlayerClass.Caballero;

    // Add and start MainScene with the resolved player class and player data
    gameRef.current.scene.add("MainScene", MainScene, true, { playerClass, playerData: user });

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
      className="w-screen h-screen bg-[#000000] flex items-center justify-center"
      aria-label="Game area"
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
