# Estructura de Directorios del Proyecto

Este documento describe la estructura completa del proyecto **Revenant App**, detallando las responsabilidades de cada carpeta y archivo. El proyecto está estructurado como una aplicación híbrida de **React** y **Phaser**, donde React maneja la interfaz de usuario, la autenticación y las peticiones al backend, mientras que Phaser se encarga exclusivamente de la renderización del motor de juego y la lógica de gameplay.

---

## 1. Estructura de la Raíz (Root)

```text
revenant-app/
├── .env                       # Variables de entorno locales (ej. URLs de la API)
├── .gitignore                 # Archivos y carpetas ignorados por Git
├── README.md                  # Descripción general del proyecto
├── eslint.config.js           # Configuración del linter ESLint
├── index.html                 # Punto de entrada HTML de la aplicación
├── package.json               # Dependencias y scripts del proyecto
├── vite.config.ts             # Configuración del bundler Vite y plugins (ej. Tailwind)
├── tsconfig.json              # Configuración general de TypeScript
├── tsconfig.app.json          # Configuración de TypeScript específica para la aplicación
├── tsconfig.node.json         # Configuración de TypeScript para el entorno Node/Vite
├── docs/                      # Documentación del sistema y arquitectura
├── public/                    # Archivos estáticos servidos directamente
└── src/                       # Código fuente de la aplicación
```

---

## 2. Carpeta de Documentación (`docs/`)

Contiene la especificación técnica de la arquitectura de Revenant.

- [controllers-backend.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/controllers-backend.md): Documentación sobre controladores y endpoints de backend.
- [game-bootstrap.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/game-bootstrap.md): Especificación del proceso de inicialización del juego.
- [game-directory-structure.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/game-directory-structure.md): Estructura detallada del módulo de juego (`src/game`).
- [game-state-machine.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/game-state-machine.md): Diseño de la máquina de estados del juego.
- [react-phaser-architecture.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/react-phaser-architecture.md): Principios de integración y separación de responsabilidades entre React y Phaser.
- [react-phaser-events.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/react-phaser-events.md): Protocolo de comunicación (Event Bus) entre React y Phaser.

---

## 3. Código Fuente (`src/`)

```text
src/
├── api/                       # Capa de cliente HTTP y llamadas al backend
├── assets/                    # Recursos gráficos y de audio de la aplicación general
├── auth/                      # Módulo de autenticación y manejo de sesión
│   ├── actions/               # Acciones asíncronas de API (Login, Registro)
│   ├── interfaces/            # Interfaces de TypeScript para autenticación
│   ├── pages/                 # Páginas de la interfaz (Login, Registro)
│   └── store/                 # Gestión de estado de sesión (Zustand)
├── config/                    # Configuraciones generales de la app React
├── game/                      # Módulo del videojuego en Phaser (Ver sección 4)
├── router/                    # Configuración de rutas de React Router
├── shared/                    # Recursos compartidos reutilizables
│   ├── components/            # Componentes React globales
│   ├── helpers/               # Utilidades y funciones de ayuda
│   └── types/                 # Tipos TypeScript compartidos
├── index.css                  # Estilos globales (Tailwind CSS)
├── main.tsx                   # Punto de entrada de React e inicialización
└── vite-env.d.ts              # Declaraciones de tipos para variables de entorno de Vite
```

### responsabilidades de las subcarpetas de `src/`

### 📂 `src/api/`
Contiene la configuración de clientes HTTP para comunicarse con el servidor.
* **Responsabilidad:** Inicializar la instancia de Axios, configurar interceptores para añadir automáticamente el token JWT en las cabeceras de autorización y definir la URL base de la API.
* **Archivos clave:**
  * [RevenantApi.ts](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/src/api/RevenantApi.ts): Configuración de Axios con el interceptor para JWT.

### 📂 `src/assets/`
* **Responsabilidad:** Almacenar recursos estáticos de uso general (como fuentes, imágenes globales y logotipos) fuera del alcance directo del motor de juego.

### 📂 `src/auth/`
Encapsula toda la lógica y pantallas asociadas a la autenticación de usuarios.
* **Subcarpetas:**
  * `actions/`: Peticiones directas a los endpoints de login y registro.
  * `interfaces/`: Tipos de datos que representan peticiones (`LoginRequest`) y respuestas (`LoginResponse`).
  * `pages/`: Vistas de formulario utilizando React y Tailwind.
  * `store/`: Store de Zustand (`auth-store.ts`) que mantiene el estado actual del usuario logueado, tokens JWT y métodos auxiliares para inicio/cierre de sesión.

### 📂 `src/config/`
* **Responsabilidad:** Configuraciones generales no relacionadas directamente con el motor de Phaser (ej. variables globales del cliente de chat, integraciones externas o ajustes generales de la UI).

### 📂 `src/router/`
* **Responsabilidad:** Definir las rutas y la navegación en la aplicación de React.
* **Archivos clave:**
  * [index.tsx](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/src/router/index.tsx): Configuración del enrutador de `react-router-dom` para direccionar las páginas de Login, Registro y el contenedor del Juego.

### 📂 `src/shared/`
Contiene recursos reutilizables compartidos por múltiples módulos.
* **Subcarpetas:**
  * `components/`: Componentes web genéricos (botones, modales, inputs) utilizables en cualquier vista de React.
  * `helpers/`: Validadores, formateadores de fechas, y utilidades matemáticas generales.
  * `types/`: Declaraciones de interfaces del dominio que se usan en más de un módulo.

---

## 4. El Módulo de Juego (`src/game/`)

El módulo `game` está estructurado bajo los principios del desarrollo de videojuegos con **Phaser**. Para una descripción detallada de este módulo, consulte [game-directory-structure.md](file:///c:/Users/santyman/Desktop/hackathon-kiro/frontend/revenant-app/docs/game-directory-structure.md).

A continuación se resume brevemente la responsabilidad de cada subcarpeta dentro de `src/game/`:

```text
src/game/
├── actions/                   # Acciones ejecutables en el juego (Move, Attack, etc.)
├── config/                    # Configuración de Phaser, físicas y cámaras
├── entities/                  # Entidades del mundo (personajes, cofres, pociones)
│   ├── characters/            # Jugador, enemigos, NPCs
│   └── objects/               # Monedas, cofres, portales
├── events/                    # Event Bus y bus de comunicación React ↔ Phaser
├── factories/                 # Fábricas para instanciación compleja de entidades
├── interfaces/                # Interfaces TypeScript de contratos (Damageable, etc.)
├── loader/                    # Cargadores de mapas Tiled, capas y spawns
├── managers/                  # Controladores de subsistemas (Audio, Escenas, Cámara)
├── maps/                      # Mapas y recursos específicos de niveles (bosque, desierto, etc.)
├── scenes/                    # Escenas de Phaser (Boot, Preload, Mapas, Tiendas)
├── services/                  # Algoritmos de gameplay compartidos (Combate, Colisiones)
├── systems/                   # Lógica continua ejecutada en el ciclo de actualización (Update)
└── ui/                        # Elementos visuales dentro del canvas de Phaser (HUD, menús)
```

---

## 5. Reglas de Arquitectura y Dependencias

Para mantener la cohesión y evitar dependencias circulares, se aplican las siguientes reglas:
1. **React** se comunica con **Phaser** únicamente a través del **Event Bus** de forma asíncrona.
2. **React** es el único responsable de la comunicación REST/HTTP. Phaser nunca debe importar `axios` ni realizar fetch directos.
3. El módulo de juego de Phaser no debe importar componentes ni utilidades de React.
4. Las dependencias permitidas dentro del juego siguen un flujo descendente estricto:
   $$\text{Escenas} \rightarrow \text{Mánagers} \rightarrow \text{Servicios} \rightarrow \text{Entidades}$$
