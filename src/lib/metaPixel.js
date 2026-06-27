/**
 * metaPixel.js
 * Helper seguro para envio de eventos ao Meta Pixel 1329781059130674.
 * Só dispara em rotas /feijoada e /feijoada/convite/:code.
 * autoConfig está desativado no index.html — apenas eventos explícitos são enviados.
 */

const PIXEL_ID = '1329781059130674';

const ALLOWED_PATHS = ['/feijoada'];
const ALLOWED_PREFIX = '/feijoada/convite/';

function isAllowedRoute() {
  const path = window.location.pathname;
  return path === ALLOWED_PATHS[0] || path.startsWith(ALLOWED_PREFIX);
}

/**
 * Dispara um evento padrão do Meta Pixel.
 * @param {string} eventName  - Ex: 'PageView', 'CompleteRegistration', 'Lead', 'Contact'
 * @param {object} [params]   - Parâmetros opcionais do evento
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (!window.fbq) return;
  if (!isAllowedRoute()) return;

  try {
    window.fbq('track', eventName, params);
  } catch (err) {
    console.warn('[MetaPixel] Erro ao disparar evento:', eventName, err);
  }
}

/**
 * Dispara um PageView explícito (usado na navegação SPA).
 */
export function trackPageView() {
  trackEvent('PageView');
}

/**
 * Dispara CompleteRegistration após cadastro bem-sucedido.
 */
export function trackCompleteRegistration() {
  trackEvent('CompleteRegistration');
}

/**
 * Dispara Lead após geração do voucher/QR Code.
 */
export function trackLead() {
  trackEvent('Lead');
}

/**
 * Dispara Contact ao clicar no CTA de WhatsApp.
 */
export function trackContact() {
  trackEvent('Contact');
}
