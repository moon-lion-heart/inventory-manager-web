const isDev = process.env.NODE_ENV === 'development';

export const devLog = (...args: any[]) => {
  if (isDev) {
    console.log('[dev]', ...args);
  }
};