# GRAB Tools

A level editing toolkit and statistics tracker for [GRAB](https://grabvr.quest).

Built with Vue 3, Vite, Tauri, Three.js, and CodeMirror.

## Setup

Requires `Node.js` 18 and `npm`.

```sh
npm install
```

## Development

Run the Vite website at `https://127.0.0.1:5173`:

```sh
npm run dev
```

## Linting & Formatting

```sh
npm run lint
npm run format
```

Editor integration:

| Editor  | Config                                                                               |
| ------- | ------------------------------------------------------------------------------------ |
| VS Code | Install ESLint and Prettier extensions                                               |
| Neovim  | Setup `prettier` with a formatting plugin, and `vtsls` and `vue-language-server` lsp |

## Build

Build the website to `dist/`:

```sh
npm run build
npm run preview
```

## Code Generation

```sh
npm run proto    # TypeScript types for protobuf
npm run helpers  # json object builders
npm run nodes    # node builders
```

## Shell Scripts

Development helper scripts in `meta/scripts/`:

| Script                                | Description                         |
| ------------------------------------- | ----------------------------------- |
| `bump-version.sh major\|minor\|patch` | Bump the project version and commit |
| `build-tauri.sh`                      | Build the desktop app               |
| `build-android.sh`                    | Build the Android APK               |
| `publish-meta.sh`                     | Upload APK to Meta                  |
| `copy-lobbies.sh`                     | Copy lobbys from GRAB               |

## Environment Variables

| Variable         | Description                             |
| ---------------- | --------------------------------------- |
| `OVR_APP_ID`     | Meta/Oculus app ID (for deployment)     |
| `OVR_APP_SECRET` | Meta/Oculus app secret (for deployment) |

## Project Structure

```sh
.
├─ meta/             # tools for development
├─ public/           # public website assets
│  ├─ fonts/           # fonts
│  ├─ images/          # images
│  ├─ levels/          # levels for editor templates
│  └─ favicon.png      # website icon
├─ src/              # website sources
│  ├─ assets/          # website assets (included in build)
│  │  ├─ bookmarklets/   # javascript bookmarklet sources
│  │  ├─ models/         # level models
│  │  ├─ proto/          # level protobuf definition
│  │  ├─ shaders/        # editor shaders
│  │  ├─ textures/       # level textures
│  │  ├─ tools/          # javascript tool modules
│  │  ├─ *.css           # global css
│  │  └─ *.js            # js utils
│  ├─ components/      # vue general components
│  │  └─ EditorPanels/   # components for the json editor
│  ├─ icons/           # vue svg icon components
│  ├─ layouts/         # vue layout components
│  ├─ pages/           # vue page components
│  ├─ requests/        # javascript fetch requests
│  ├─ stores/          # vue session stores
│  ├─ tools/           # vue tool components
│  ├─ App.vue          # vue app structure
│  ├─ config.js        # general config / globals
│  ├─ main.js          # website javascript entrypoint
│  └─ router.js        # vue router config
├─ src-tauri/        # tauri rust application sources
├─ .eslintrc.cjs     # eslint linting config
├─ .gitignore        # gitignore
├─ .nvim.lua         # optional nvim config
├─ .prettierrc.json  # prettier formatting config
├─ CONTRIBUTING.md   # contribution guide
├─ README.md         # this file
├─ index.html        # mountable app html
├─ jsconfig.json     # javascript config
├─ package-lock.json # npm packages lock file
├─ package.json      # npm config and packages
└─ vite.config.js    # vite config
```
