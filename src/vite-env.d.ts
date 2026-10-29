/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LAN_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
