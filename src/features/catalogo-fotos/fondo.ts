import type { CSSProperties } from "react";

/**
 * Fondo de cuadritos (como en los editores de imagen) detrás de las fotos del catálogo:
 * así se nota que una foto sin fondo es transparente, en vez de taparla con blanco.
 */
export const FONDO_TRANSPARENTE: CSSProperties = {
  background: "repeating-conic-gradient(#2a2f3a 0 25%, #222731 0 50%) 0 0 / 16px 16px",
};
