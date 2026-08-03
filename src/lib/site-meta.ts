/**
 * Centralized site metadata.
 * Edit the values below to rebrand the whole site from one place.
 */
export const SITE_NAME = "Excelência Multimarcas";
export const SITE_TAGLINE = "Seu próximo carro está aqui";
export const SITE_DESCRIPTION =
  "Loja multimarcas com padrão premium: veículos revisados, procedência garantida, financiamento facilitado e as melhores condições da região.";
export const SITE_LOCALE = "pt-BR";
export const SITE_URL = "https://excelenciamultimarcas.com.br";

export const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cf5e83bb-ce9b-491f-883c-40a8ca3227f0/id-preview-805b93ac--fdd09f19-f5bd-4339-874b-7523875a4009.lovable.app-1783953810897.png";

export function title(pageTitle?: string) {
  return pageTitle ? `${pageTitle} | ${SITE_NAME}` : `${SITE_NAME} | ${SITE_TAGLINE}`;
}
