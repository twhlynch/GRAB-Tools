# GRAB Tools

GRAB Tools website and app

Built using Vue 3

## Project Structure

```sh
.
├─ dist/ # website build output
├─ meta/ # useful extras for development
├─ public/ # public website assets (not built)
│  ├─ images/ # images
│  ├─ proto/ # protobuf message definitions
│  └─ favicon.png # website icon
├─ src/ # website sources
│  ├─ assets/ # website assets (included in build)
│  │  ├─ bookmarklets/ # javasctript bookmarklet sources
│  │  ├─ tools/ # javascript tool modules
│  │  └─ globals.css # global css styles
│  ├─ components/ # vue general components
│  ├─ icons/ # vue svg icon components
│  ├─ layouts/ # vue layout components
│  ├─ pages/ # vue page components
│  ├─ requests/ # javascript fetch requests
│  ├─ stores/ # vue session stores
│  ├─ tools/ # vue tool components
│  ├─ App.vue # vue app structure
│  ├─ config.js # general config / globals
│  ├─ main.js # website javascript entrypoint
│  └─ router.js # vue router config
├─ src-tauri/ # rust application sources
│  ├─ capabilities/ # application permissions config
│  ├─ gen/android/ # kotlin android sources
│  ├─ icons/ # application icons (`npm run tauri icon public/favicon.png`)
│  ├─ src/ # rust application sources
│  ├─ Cargo.lock # rust cargo packages lock file
│  ├─ Cargo.toml # rust cargo packages
│  ├─ build.rs # rust build config
│  └─ tauri.conf.json # tauri config
├─ .eslintrc.cjs # eslint linting config
├─ .gitignore # gitignore
├─ .prettierrc.json # prettier formatting config
├─ README.md # this file
├─ index.html # mountable app html
├─ jsconfig.json # javascript config
├─ package-lock.json # npm packages lock file
├─ package.json # npm config and packages
└─ vite.config.js # vite config
```

### Setup
```sh
npm install
```

### Test website
```sh
npm run dev
```

### Build website
```sh
npm run build
```

### Test application
```sh
npm run tauri dev
```

### Build application
```sh
npm run tauri build
```

### Build Android application
```sh
npm run tauri android build
```
