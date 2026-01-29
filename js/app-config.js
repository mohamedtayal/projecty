(function initAppConfig(global) {
  const existing = global.APP_CONFIG || {};
  const hostname = global.location?.hostname || '';
  const origin = global.location?.origin || '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const hasCustomBase = typeof existing.apiBaseUrl === 'string' && existing.apiBaseUrl.trim().length > 0;
  const sanitizedOrigin = origin && origin !== 'null' ? origin.replace(/\/$/, '') : '';

  let normalizedBase = '';

  if (hasCustomBase) {
    normalizedBase = existing.apiBaseUrl.trim().replace(/\/$/, '');
  } else if (isLocalhost) {
    normalizedBase = 'http://localhost:3000/api';
  } else if (sanitizedOrigin) {
    normalizedBase = `${sanitizedOrigin}/api`;
  }

  global.APP_CONFIG = {
    apiBaseUrl: normalizedBase,
    backendHealthEndpoint: existing.backendHealthEndpoint || '/health',
    backendRequestTimeout: existing.backendRequestTimeout || 6000,
    demoMode: existing.demoMode === true
  };
})(window);
