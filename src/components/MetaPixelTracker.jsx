/**
 * MetaPixelTracker.jsx
 * Componente sem UI que:
 * 1. Dispara PageView sempre que a rota muda (navegação SPA)
 * 2. Dispara evento Contact ao clicar em links do WhatsApp oficial do Nômade
 *
 * Deve ser montado UMA VEZ dentro do <Router>, acima das rotas.
 * Exemplo de uso em App.jsx:
 *
 *   import MetaPixelTracker from './components/MetaPixelTracker';
 *   ...
 *   <Router>
 *     <MetaPixelTracker />
 *     <Routes>...</Routes>
 *   </Router>
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackContact } from '../lib/metaPixel';

// Número oficial do Nômade — qualquer link com esse número dispara Contact
const NOMADE_WHATSAPP = '5511916547785';

export default function MetaPixelTracker() {
  const location = useLocation();

  // PageView em toda mudança de rota permitida
  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  // Listener global para cliques em links de WhatsApp do Nômade
  useEffect(() => {
    function handleClick(e) {
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href') || '';
      if (
        href.includes('wa.me/' + NOMADE_WHATSAPP) ||
        href.includes('api.whatsapp.com/send') && href.includes(NOMADE_WHATSAPP)
      ) {
        trackContact();
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
