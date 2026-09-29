# Giỏi's Developer Village

Interactive 3D portfolio of **Trần Văn Giỏi — Frontend Developer**. A cozy floating-island
village where every building is a portfolio section. The content is plain, accessible HTML;
the 3D world (Three.js) is an enhancement that can be switched off at any time.

- **Stack:** Angular 22 (standalone, signals, zoneless, Signal Forms) · Three.js r186 · GSAP ·
  Tailwind CSS 4 · Vitest · ESLint (angular-eslint) · Prettier

## Scripts

```bash
npm start          # dev server → http://localhost:4200
npm run build      # production build → dist/portfolio-village/browser
npm test           # unit tests (Vitest)
npm run lint       # ESLint
```

Deploy `dist/portfolio-village/browser` to any static host. Configure an SPA fallback
(all unknown paths → `index.html`) so deep links like `/projects?project=stma` work.

## Village map

| Building         | Route         | Section            |
| ---------------- | ------------- | ------------------ |
| Central Plaza    | `/`           | Home               |
| Career Tower     | `/experience` | Work experience    |
| Project Workshop | `/projects`   | Featured projects  |
| Skills Garden    | `/skills`     | Technical skills   |
| Learning Academy | `/learning`   | Learning & goals   |
| About Me House   | `/about`      | About me           |
| Contact Shrine   | `/contact`    | Contact            |

## Structure

```
src/app/
  data/        portfolio content (CV is the source of truth) — edit here, not in templates
  models/      typed models (Building, Project, Experience, Skill, Profile…)
  services/    PortfolioDataService, WorldStateService (no Three.js), AudioService
  components/  NavigationMenu, PortfolioPanel (BuildingInfoPanel), PortfolioModal, ProjectCard,
               SkillBadge, TechnologyBadge, ExperienceTimeline, ContactForm, LoadingScreen…
  pages/       one page per building (lazy loaded)
  world/       the 3D village (lazy loaded via @defer)
    services/  ThreeSceneService, CameraService, InteractionService, AssetLoaderService
    objects/   terrain, sky, nature, avatar, spirit companions, buildings/*
    utils/     materials, geometry helpers (static merging), canvas textures, RNG
```

## Extending

- **New project / job / skill:** add an entry in `src/app/data/*.data.ts`.
- **New building:** add it to `buildings.data.ts`, register a builder in
  `world/objects/buildings/index.ts`, and add a route with `data: { building: '<id>' }`.
- **Real 3D models:** set `modelUrl: 'models/tower.glb'` on a building (files go in `public/`).
  The GLB replaces the procedural placeholder; `AssetLoaderService` caches it.
- **Social links:** set `url` in `PROFILE.socials` (currently `null` → shown as "soon").

## Sound

All audio is generated with the Web Audio API (no audio files): generative pentatonic music
(koto / music-box plucks over soft pads), nature ambience (wind, birds, running water that gets
louder near the waterfalls), footsteps, and UI effects for every click, hover, panel and companion.
Visitors opt in at the "Enter the village" gate; Music / Nature / Effects / volume live in the
sound panel.

## Custom avatar model

The built-in avatar is a procedural cel-shaded chibi. For a character that matches the concept
art exactly, create a GLB (e.g. image-to-3D tools such as Meshy, Tripo or Hyper3D Rodin, or
Blender), put it in `public/models/avatar.glb` and set `AVATAR_MODEL = 'models/avatar.glb'` in
`src/app/data/portfolio.data.ts`. Clips named `idle` and `walk` are played automatically.

## Performance & accessibility

- Initial bundle ≈ 103 kB gzipped; the 3D chunk (~203 kB gz) loads lazily after first paint.
- Bloom + colour grading on capable devices only; dropped automatically if frames are slow.
- Procedural low-poly assets (no downloads), instanced vegetation, static-mesh merging,
  frustum culling, pixel-ratio caps, adaptive quality (drops resolution/shadows if slow),
  reduced scene on mobile, rendering paused behind full-screen panels.
- WebGL unavailable or context lost → classic 2D view. Visitors can also switch manually.
- Keyboard navigation, skip link, visible focus, native `<dialog>`, labelled form errors,
  reduced-motion support (system setting or in-app toggle), sound off by default.

## Content notes

- Responsibilities for the FPT IS projects are summarised from the CV profile — replace them
  with the exact CV bullet points if needed (`projects.data.ts`).
- GSOFT and Nata Vietnam projects have no details in the CV, so the UI says
  "available on request" instead of inventing content.
- TOEIC 700 and Frontend Leader are listed as **goals**, not achievements.
- Tech logos: [Devicon](https://devicon.dev) (MIT), self-hosted in `public/icons/tech`.
- Interior furniture: [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) (CC0),
  self-hosted in `public/models/furniture`.
