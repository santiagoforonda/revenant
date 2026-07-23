# Revenant App

Frontend de Revenant App construido con Vite, React, TypeScript y Phaser.

## Stack

### Runtime

- `react` `19.1.1`
- `react-dom` `19.1.1`
- `phaser` `4.2.1`
- `axios` `1.18.1`
- `react-router-dom` `7.18.1`
- `react-hook-form` `7.82.0`
- `zod` `4.4.3`
- `zustand` `5.0.14`
- `@tanstack/react-query` `5.101.3`
- `react-hot-toast` `2.6.0`
- `tailwindcss` `4.3.3`
- `@tailwindcss/vite` `4.3.3`
- `daisyui` `5.7.0`

### Desarrollo

- `vite` `7.1.7`
- `typescript` `5.8.3`
- `@vitejs/plugin-react-swc` `4.1.0`
- `eslint` `9.36.0`
- `@eslint/js` `9.36.0`
- `typescript-eslint` `8.44.0`
- `eslint-plugin-react-hooks` `5.2.0`
- `eslint-plugin-react-refresh` `0.4.20`
- `globals` `16.4.0`

## Arquitectura y Estructura

La aplicación está organizada por capas para separar las responsabilidades de React (interfaz, enrutamiento, estado global y API) y de Phaser (motor de juego, físicas y gameplay):

* **Estructura del Proyecto:** La descripción y responsabilidades de todas las carpetas del proyecto se encuentra en [docs/project-directory-structure.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/project-directory-structure.md).
* **Módulo de Juego:** El detalle de las carpetas internas de Phaser y sus responsabilidades está definido en [docs/game-directory-structure.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/game-directory-structure.md).
* **Integración React-Phaser:** El flujo de trabajo y la comunicación a través del Event Bus están explicados en [docs/react-phaser-architecture.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/react-phaser-architecture.md) y [docs/react-phaser-events.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/react-phaser-events.md).
* **Inicialización y Ciclo de Vida:** La secuencia de arranque de la aplicación y la carga de datos están en [docs/game-bootstrap.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/game-bootstrap.md).
