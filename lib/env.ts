export function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

export function readEnvNumber(name: string): number {
  const raw = readEnv(name);
  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new Error(`${name} is not a valid number: ${raw}`);
  }
  return num;
}
