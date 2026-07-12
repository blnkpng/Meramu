(function () {
  'use strict';

  const config = window.MERAMU_CONFIG;
  const READ_ACTIONS = new Set([
    'ping',
    'initial',
    'stock',
    'batches',
    'bottlings',
    'transactions',
    'reports',
    'dashboard',
    'notification-settings',
    'app-settings'
  ]);

  const NO_IDEMPOTENCY_ACTIONS = new Set(['login', 'logout']);
  const AUTH_ERROR_CODES = new Set(['AUTH_EXPIRED', 'ACCOUNT_DISABLED']);
  const RETRYABLE_CODES = new Set(['TEMPORARY_ERROR', 'LOCK_TIMEOUT']);

  class MeramuApiError extends Error {
    constructor(message, options = {}) {
      super(message);
      this.name = 'MeramuApiError';
      this.code = options.code || 'API_ERROR';
      this.retryable = Boolean(options.retryable);
      this.status = options.status || 0;
    }
  }

  async function request(action, payload = {}, options = {}) {
    if (config.DEMO_MODE) return mockRequest(action, payload);
    if (!config.API_URL) {
      throw new MeramuApiError('URL API MERAMU belum diatur.', {code: 'API_NOT_CONFIGURED'});
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new MeramuApiError(
        'Perangkat sedang offline. Hubungkan internet lalu kirim kembali.',
        {code: 'OFFLINE'}
      );
    }

    const token = options.token !== undefined ? options.token : getStoredToken();
    const isRead = READ_ACTIONS.has(action);
    const requestPayload = preparePayload(action, payload);
    const maxRetries = Number.isInteger(options.retries)
      ? Math.max(0, options.retries)
      : (isRead ? 2 : 1);

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        return await requestOnce(action, requestPayload, {
          token,
          timeout: options.timeout || (isRead ? 30000 : 45000)
        });
      } catch (error) {
        lastError = normalizeError(error);

        if (AUTH_ERROR_CODES.has(lastError.code)) {
          window.dispatchEvent(new CustomEvent('meramu:auth-expired', {
            detail: {code: lastError.code, message: lastError.message}
          }));
          throw lastError;
        }

        if (!shouldRetry(lastError, attempt, maxRetries)) throw lastError;
        await delay(retryDelay(attempt));
      }
    }

    throw lastError || new MeramuApiError('Permintaan tidak dapat diproses.', {code: 'API_ERROR'});
  }

  function preparePayload(action, payload) {
    const clone = Object.assign({}, payload || {});

    if (!READ_ACTIONS.has(action) && !NO_IDEMPOTENCY_ACTIONS.has(action)) {
      clone.requestId = clone.requestId || createRequestId(action);
    }

    return clone;
  }

  function createRequestId(action) {
    const random = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    return `web:${String(action || 'action')}:${random}`;
  }

  async function requestOnce(action, payload, options) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), options.timeout);

    try {
      const response = READ_ACTIONS.has(action)
        ? await getRequest(action, options.token, payload, controller.signal)
        : await postRequest(action, options.token, payload, controller.signal);

      const text = await response.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new MeramuApiError(
          'Respons server MERAMU tidak valid. Pastikan deployment memakai Code.gs terbaru.',
          {code: 'INVALID_RESPONSE', status: response.status}
        );
      }

      if (!response.ok) {
        throw new MeramuApiError(
          `Server MERAMU merespons ${response.status}.`,
          {
            code: response.status >= 500 ? 'TEMPORARY_ERROR' : 'HTTP_ERROR',
            retryable: response.status >= 500,
            status: response.status
          }
        );
      }

      if (result && (result.ok === false || result.success === false)) {
        throw new MeramuApiError(
          result.message || 'Permintaan tidak dapat diproses.',
          {
            code: result.code || 'APPLICATION_ERROR',
            retryable: Boolean(result.retryable) || RETRYABLE_CODES.has(result.code),
            status: response.status
          }
        );
      }

      return result;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new MeramuApiError(
          'Koneksi terlalu lama. Sistem akan mencoba kembali secara aman.',
          {code: 'TIMEOUT', retryable: true}
        );
      }

      if (error instanceof TypeError) {
        throw new MeramuApiError(
          'API MERAMU tidak dapat dihubungi. Periksa internet dan deployment Web App.',
          {code: 'NETWORK_ERROR', retryable: true}
        );
      }

      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function shouldRetry(error, attempt, maxRetries) {
    if (attempt >= maxRetries) return false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
    if (error.retryable) return true;
    return ['TIMEOUT', 'NETWORK_ERROR', 'TEMPORARY_ERROR', 'LOCK_TIMEOUT'].includes(error.code);
  }

  function retryDelay(attempt) {
    return Math.min(3500, 700 * Math.pow(2, attempt) + Math.floor(Math.random() * 250));
  }

  function normalizeError(error) {
    if (error instanceof MeramuApiError) return error;
    return new MeramuApiError(
      error?.message || 'Permintaan tidak dapat diproses.',
      {code: error?.code || 'API_ERROR', retryable: Boolean(error?.retryable)}
    );
  }

  function getRequest(action, token, payload, signal) {
    const url = new URL(config.API_URL);
    url.searchParams.set('action', action);
    if (token) url.searchParams.set('token', token);

    Object.entries(payload || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    return fetch(url.toString(), {
      method: 'GET',
      signal,
      redirect: 'follow',
      cache: 'no-store'
    });
  }

  function postRequest(action, token, payload, signal) {
    const body = action === 'login'
      ? {
          action: 'login',
          username: payload.username || '',
          password: payload.password || ''
        }
      : {action, token: token || '', payload: payload || {}};

    return fetch(config.API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify(body),
      signal,
      redirect: 'follow',
      cache: 'no-store'
    });
  }

  function getStoredToken() {
    try {
      const raw = localStorage.getItem(config.SESSION_KEY);
      const session = raw ? JSON.parse(raw) : null;
      return session?.token || '';
    } catch {
      return '';
    }
  }

  async function mockRequest(action, payload) {
    await delay(450);
    if (action === 'login') {
      if (payload.username === 'admin' && payload.password === '123456') {
        return {
          ok: true,
          user: {username: 'admin', name: 'Administrator', role: 'ADMIN'},
          token: 'demo-session-token'
        };
      }
      throw new MeramuApiError('Username atau password belum sesuai.', {code: 'LOGIN_FAILED'});
    }
    return {ok: true, data: null};
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  window.MeramuAPI = Object.freeze({request, MeramuApiError});
})();
