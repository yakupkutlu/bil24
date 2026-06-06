const format = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const suffix = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level.toUpperCase()} ${message}${suffix}`;
};

export const logger = {
  info(message, meta) {
    console.log(format('info', message, meta));
  },
  warn(message, meta) {
    console.warn(format('warn', message, meta));
  },
  error(message, meta) {
    console.error(format('error', message, meta));
  },
  debug(message, meta) {
    if (process.env.NODE_ENV !== 'production') console.debug(format('debug', message, meta));
  }
};
