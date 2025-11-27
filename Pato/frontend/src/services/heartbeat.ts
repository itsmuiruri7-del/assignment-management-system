import api from './api';

let _timer: ReturnType<typeof setInterval> | null = null;

export function startHeartbeat(intervalMs = 30000) {
  // avoid starting multiple timers
  if (_timer) return;

  const ping = async () => {
    try {
      await api.get('/health');
      // console.debug('API heartbeat OK');
    } catch (err) {
      // console.warn('API heartbeat failed', err);
    }
  };

  // initial ping
  void ping();

  _timer = setInterval(ping, intervalMs);
}

export function stopHeartbeat() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
  }
}
