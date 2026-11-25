import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { AppShell } from './App';
import { SessionProvider } from './context/SessionContext';
import { INDEXABLE_ROUTES, OG_IMAGE, SITE_NAME, getRouteSeo } from './data/seo';
import Runner from './runner/Runner';

export { INDEXABLE_ROUTES, OG_IMAGE, SITE_NAME };

export function renderRoute(url: string) {
  const html = ReactDOMServer.renderToString(
    <SessionProvider>
      <StaticRouter location={url}>
        <AppShell runnerComponent={Runner} />
      </StaticRouter>
    </SessionProvider>,
  );
  return {
    html,
    seo: getRouteSeo(url),
  };
}
