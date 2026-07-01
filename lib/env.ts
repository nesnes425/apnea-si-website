export function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

export function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value || undefined;
}

export function readEnvNumber(name: string): number {
  const raw = readEnv(name);
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new Error(`${name} is not a valid number: ${raw}`);
  }
  return num;
}

export function readOptionalEnvNumber(name: string): number | undefined {
  const raw = readOptionalEnv(name);
  if (!raw) return undefined;
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new Error(`${name} is not a valid number: ${raw}`);
  }
  return num;
}
