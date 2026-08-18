/**
 * Centralized site metadata.
 * Edit the values below to rebrand the whole site from one place.
 */
export const SITE_NAME = "Jonathan Veículos";
export const SITE_TAGLINE = "Encontre o veículo ideal para você";
export const SITE_DESCRIPTION =
  "Jonathan Veículos - Veículos selecionados, revisados e com excelentes condições de negociação. Encontre seu próximo carro.";
export const SITE_LOCALE = "pt-BR";
export const SITE_URL = "https://lojajonathanveiculos.com.br";

export const OG_IMAGE = "/og-jonathan-veiculos-2026.jpg";

export function title(pageTitle?: string) {
  return pageTitle ? `${pageTitle} | ${SITE_NAME}` : `${SITE_NAME} | ${SITE_TAGLINE}`;
}
