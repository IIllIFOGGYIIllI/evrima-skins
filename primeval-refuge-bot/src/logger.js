function stamp() { return new Date().toISOString(); }
function serialize(value) {
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === "string") return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}
export const log = {
  info: (...args) => console.log(`[${stamp()}] [INFO]`, ...args.map(serialize)),
  warn: (...args) => console.warn(`[${stamp()}] [WARN]`, ...args.map(serialize)),
  error: (...args) => console.error(`[${stamp()}] [ERROR]`, ...args.map(serialize))
};
