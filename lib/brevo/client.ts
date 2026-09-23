import { readEnv } from "@/lib/env";
import { normalizePhoneForBrevo } from "./phone";

const BREVO_API = "https://api.brevo.com/v3";
const REQUEST_TIMEOUT_MS = 10000;

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
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo ${init.method ?? "GET"} ${path} failed (${res.status}): ${body}`);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

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

export async function upsertContact(params: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  listIds: number[];
}): Promise<void> {
  const attributesWithoutPhone = {
    FIRSTNAME: params.firstName,
    LASTNAME: params.lastName,
  };
  const phone = normalizePhoneForBrevo(params.phone);
  const body = {
      email: params.email,
      attributes: phone ? { ...attributesWithoutPhone, SMS: phone } : attributesWithoutPhone,
      listIds: params.listIds,
      updateEnabled: true,
  };

  try {
    await brevoFetch("/contacts", {
      method: "POST",
      body: JSON.stringify(body),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Brevo rejects the whole contact over a phone number it does not like
    // (already used by someone else, or still not valid for its country).
    // Being on the group list matters more than storing the number.
    const phoneRejected =
      Boolean(phone) &&
      (message.includes("Invalid phone number") ||
        (message.includes("invalid_parameter") && message.includes("SMS")) ||
        (message.includes("duplicate_parameter") && message.includes("SMS")));
    if (!phoneRejected) throw error;

    console.warn(
      `Brevo rejected the phone number for ${params.email}; adding the contact without it`,
      message
    );
    await brevoFetch("/contacts", {
      method: "POST",
      body: JSON.stringify({ ...body, attributes: attributesWithoutPhone }),
    });
  }
}

export async function upsertEmailContact(params: {
  email: string;
  listIds: number[];
}): Promise<void> {
  await brevoFetch("/contacts", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      listIds: params.listIds,
      updateEnabled: true,
    }),
  });
}

export type EmailAttachment = {
  name: string; // filename, e.g. "darilni-bon.pdf"
  contentBase64: string; // base64-encoded file contents
};

export async function sendTransactionalEmail(params: {
  to: { email: string; name?: string };
  subject: string;
  text: string;
  html: string;
  replyTo?: { email: string; name?: string };
  attachments?: EmailAttachment[];
}): Promise<void> {
  const attachment = params.attachments?.map((a) => ({
    name: a.name,
    content: a.contentBase64,
  }));

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
      attachment,
    }),
  });
}
