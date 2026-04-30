const BREVO_API = "https://api.brevo.com/v3";

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} environment variable`);
  return value;
}

function authHeaders() {
  return {
    "api-key": readEnv("BREVO_API_KEY"),
    "content-type": "application/json",
    accept: "application/json",
  };
}

async function brevoFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BREVO_API}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${init.method ?? "GET"} ${path} failed (${res.status}): ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// === Lists ===

export async function createList(params: {
  name: string;
  folderId: number;
}): Promise<number> {
  const result = await brevoFetch<{ id: number }>("/contacts/lists", {
    method: "POST",
    body: JSON.stringify({ name: params.name, folderId: params.folderId }),
  });
  return result.id;
}

// === Contacts ===

export async function upsertContact(params: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  listIds: number[];
}): Promise<void> {
  await brevoFetch("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      attributes: {
        FIRSTNAME: params.firstName,
        LASTNAME: params.lastName,
        SMS: params.phone,
      },
      listIds: params.listIds,
      updateEnabled: true,
    }),
  });
}

// === Transactional emails ===

export async function sendTransactionalEmail(params: {
  to: { email: string; name?: string };
  subject: string;
  text: string;
  html: string;
  replyTo?: { email: string; name?: string };
}): Promise<void> {
  await brevoFetch("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: {
        email: readEnv("BREVO_FROM_EMAIL"),
        name: readEnv("BREVO_FROM_NAME"),
      },
      to: [params.to],
      subject: params.subject,
      textContent: params.text,
      htmlContent: params.html,
      replyTo: params.replyTo,
    }),
  });
}
