# YAMLCompose

A visual two-way editor for Docker Compose. Paste a `docker-compose.yml`, see it rendered as an interactive architecture graph, and edit either representation — the YAML or the diagram — with changes staying perfectly in sync.

Everything runs entirely in the browser. No backend, no account, no data ever leaves your machine.

## Features

- **YAML → Graph** — paste or write a Compose file and instantly see services, networks, volumes, and dependencies as a laid-out architecture diagram.
- **Graph → YAML** — add, connect, rename, duplicate, or delete services directly on the canvas; the underlying YAML regenerates automatically.
- **Two-way sync** — edits in either direction update the other, backed by a single normalized Compose model as the source of truth.
- **Undo / redo** — every mutation (graph or YAML) is a reversible command.
- **Technology detection** — recognizes common images (Postgres, Redis, Nginx, etc.) and renders their real brand icons and category colors.
- **Database/cache/proxy presets** — add a new node from a preset (PostgreSQL, MySQL, Redis, Nginx, …) with sensible defaults, fully editable.
- **Relationship inspector** — click any edge to see and change its type (`depends_on`, `network`, `volume`, `link`), or detach it.
- **Multiple themed code editors**, built-in example stacks, PNG/SVG-ready architecture canvas, and a brutalist, information-dense UI.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [@xyflow/react](https://reactflow.dev) for the interactive graph canvas
- [@dagrejs/dagre](https://github.com/dagrejs/dagre) for automatic graph layout
- [Zustand](https://github.com/pmndrs/zustand) for application state
- [CodeMirror](https://codemirror.net) for the YAML editor
- [yaml](https://eemeli.org/yaml/) for parsing and serialization

## Getting Started

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and visit `/playground` to start editing a Compose file.

## Project Structure

```
src/
├── app/                  # Next.js routes (/ and /playground)
├── components/
│   ├── editor/           # YAML editor, theme selector, examples
│   ├── graph/             # Graph canvas, nodes, edges, add/connect/delete UI
│   ├── workspace/        # Tabs, inspectors, status bar
│   └── layout/            # Marketing/homepage components
├── lib/
│   ├── parser/            # YAML → Compose model
│   ├── compose/           # Mutations, serializer, undo/redo history, presets
│   ├── graph/              # Graph building and dagre layout
│   └── technology/       # Image/service detection and category styling
├── store/                 # Zustand store tying model, graph, and UI state together
└── types/                  # Compose data model types
```

## Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Build for production         |
| `npm run start` | Run the production build     |
| `npm run lint`  | Run ESLint                   |

#
