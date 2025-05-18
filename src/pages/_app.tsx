// pages/_app.tsx
import "../styles/globals.css";   // ← relative path from pages/_app.tsx
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
