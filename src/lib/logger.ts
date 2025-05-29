// Simple logger that works in all environments without worker threads
const logger = {
  info: (obj: any, msg?: string) => {
    if (msg) {
      console.log(`[INFO] ${msg}`, obj);
    } else {
      console.log('[INFO]', obj);
    }
  },
  error: (obj: any, msg?: string) => {
    if (msg) {
      console.error(`[ERROR] ${msg}`, obj);
    } else {
      console.error('[ERROR]', obj);
    }
  },
  warn: (obj: any, msg?: string) => {
    if (msg) {
      console.warn(`[WARN] ${msg}`, obj);
    } else {
      console.warn('[WARN]', obj);
    }
  },
  debug: (obj: any, msg?: string) => {
    if (process.env.NODE_ENV !== 'production') {
      if (msg) {
        console.debug(`[DEBUG] ${msg}`, obj);
      } else {
        console.debug('[DEBUG]', obj);
      }
    }
  }
};

export default logger; 