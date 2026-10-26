type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || "info";

const shouldLog = (level: LogLevel): boolean =>
  LEVELS[level] >= LEVELS[currentLevel];

const format = (level: string, message: string, meta?: object): string => {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  debug: (message: string, meta?: object) => {
    if (shouldLog("debug")) {
      console.debug(format("debug", message, meta));
    }
  },

  info: (message: string, meta?: object) => {
    if (shouldLog("info")) {
      console.info(format("info", message, meta));
    }
  },

  warn: (message: string, meta?: object) => {
    if (shouldLog("warn")) {
      console.warn(format("warn", message, meta));
    }
  },

  error: (message: string, meta?: object) => {
    if (shouldLog("error")) {
      console.error(format("error", message, meta));
    }
  },
};
