// /// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string
  [key: string]: any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const process: {
  env: {
    API_KEY: string;
    [key: string]: any;
  }
}