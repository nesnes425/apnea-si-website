import { readEnv, readOptionalEnv } from "@/lib/env";

const DEFAULT_MINIMAX_API_BASE = "https://moj.minimax.si/si/api";
const DEFAULT_MINIMAX_AUTH_URL = "https://moj.minimax.si/si/aut/oauth20/token";
const REQUEST_TIMEOUT_MS = 8000;

type MinimaxToken = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

let cachedToken: { accessToken: string; expiresAt: number } | undefined;

export type MinimaxFkField = {
  ID?: number;
  Name?: string;
  ResourceUrl?: string;
};

export type MinimaxDocumentAttachment = {
  ID?: number;
  DocumentAttachmentId?: number;
  Document?: MinimaxFkField;
  AttachmentData?: string;
  FileName?: string;
  MimeType?: string;
  ResourceUrl?: string;
};

export type MinimaxIssuedInvoice = {
  IssuedInvoiceId: number;
  Year?: number;
  InvoiceNumber?: number;
  DocumentReference?: string;
  InvoiceAttachment?: MinimaxDocumentAttachment;
  RowVersion?: string;
};

export type MinimaxIssuedInvoiceSearch = {
  IssuedInvoiceId: number;
  Year?: number;
  InvoiceNumber?: number;
  DateIssued?: string;
  RowVersion?: string;
};

export type MinimaxCreatedInvoice = {
  issuedInvoiceId: number;
  rowVersion?: string;
  year?: number;
  invoiceNumber?: number;
};

export type MinimaxCustomer = {
  CustomerId: number;
  Code?: string;
  Name?: string;
  RowVersion?: string;
};

export type MinimaxItem = {
  ItemId: number;
  Code?: string;
  Name?: string;
  RowVersion?: string;
};

type MinimaxSearchResult<T> = {
  Rows?: T[];
  TotalRows?: number;
  CurrentPageNumber?: number;
  PageSize?: number;
};

function minimaxApiBase() {
  return readOptionalEnv("MINIMAX_API_BASE") ?? DEFAULT_MINIMAX_API_BASE;
}

function minimaxAuthUrl() {
  return readOptionalEnv("MINIMAX_AUTH_URL") ?? DEFAULT_MINIMAX_AUTH_URL;
}

function makeUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const base = minimaxApiBase().replace(/\/$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

async function requestToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "password",
    client_id: readEnv("MINIMAX_CLIENT_ID"),
    client_secret: readEnv("MINIMAX_CLIENT_SECRET"),
    username: readEnv("MINIMAX_USERNAME"),
    password: readEnv("MINIMAX_PASSWORD"),
  });

  const res = await fetch(minimaxAuthUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const responseBody = await res.text();
    throw new Error(`Minimax auth failed (${res.status}): ${responseBody}`);
  }

  const token = (await res.json()) as MinimaxToken;
  cachedToken = {
    accessToken: token.access_token,
    expiresAt: now + (token.expires_in ?? 300) * 1000,
  };
  return cachedToken.accessToken;
}

async function minimaxFetch<T>(
  pathOrUrl: string,
  init: RequestInit = {}
): Promise<T> {
  const accessToken = await requestToken();
  const res = await fetch(makeUrl(pathOrUrl), {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: "application/json",
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const responseBody = await res.text();
    throw new Error(
      `Minimax ${init.method ?? "GET"} ${pathOrUrl} failed (${res.status}): ${responseBody}`
    );
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function unwrapIssuedInvoice(response: unknown): MinimaxIssuedInvoice {
  const value = response as
    | MinimaxIssuedInvoice
    | { Data?: MinimaxIssuedInvoice; Content?: MinimaxIssuedInvoice };
  const invoice = "IssuedInvoiceId" in value ? value : value.Data ?? value.Content;
  if (!invoice?.IssuedInvoiceId) {
    throw new Error("Minimax response did not include IssuedInvoiceId");
  }
  return invoice;
}

function unwrapCustomer(response: unknown): MinimaxCustomer {
  const value = response as MinimaxCustomer | { Data?: MinimaxCustomer; Content?: MinimaxCustomer };
  const customer = "CustomerId" in value ? value : value.Data ?? value.Content;
  if (!customer?.CustomerId) {
    throw new Error("Minimax response did not include CustomerId");
  }
  return customer;
}

function unwrapItem(response: unknown): MinimaxItem {
  const value = response as MinimaxItem | { Data?: MinimaxItem; Content?: MinimaxItem };
  const item = "ItemId" in value ? value : value.Data ?? value.Content;
  if (!item?.ItemId) {
    throw new Error("Minimax response did not include ItemId");
  }
  return item;
}

function isMinimaxNotFound(error: unknown) {
  return error instanceof Error && error.message.includes(" failed (404):");
}

export async function createIssuedInvoice(params: {
  organisationId: number;
  issuedInvoice: Record<string, unknown>;
}): Promise<MinimaxCreatedInvoice> {
  const response = await minimaxFetch<unknown>(
    `/api/orgs/${params.organisationId}/issuedinvoices`,
    {
      method: "POST",
      body: JSON.stringify(params.issuedInvoice),
    }
  );
  const invoice = unwrapIssuedInvoice(response);
  return {
    issuedInvoiceId: invoice.IssuedInvoiceId,
    rowVersion: invoice.RowVersion,
    year: invoice.Year,
    invoiceNumber: invoice.InvoiceNumber,
  };
}

export async function getIssuedInvoice(params: {
  organisationId: number;
  issuedInvoiceId: number;
}): Promise<MinimaxIssuedInvoice> {
  const response = await minimaxFetch<unknown>(
    `/api/orgs/${params.organisationId}/issuedinvoices/${params.issuedInvoiceId}`
  );
  return unwrapIssuedInvoice(response);
}

export async function listIssuedInvoices(params: {
  organisationId: number;
  invoiceType: "R" | "P";
  dateIssuedFrom?: string;
  dateIssuedTo?: string;
  pageSize?: number;
}): Promise<MinimaxIssuedInvoiceSearch[]> {
  const query = new URLSearchParams({
    InvoiceType: params.invoiceType,
    CurrentPage: "1",
    PageSize: String(params.pageSize ?? 50),
    SortField: "DateIssued",
    Order: "D",
  });
  if (params.dateIssuedFrom) query.set("DateIssuedFrom", params.dateIssuedFrom);
  if (params.dateIssuedTo) query.set("DateIssuedTo", params.dateIssuedTo);

  const response = await minimaxFetch<MinimaxSearchResult<MinimaxIssuedInvoiceSearch>>(
    `/api/orgs/${params.organisationId}/issuedinvoices?${query.toString()}`
  );
  return response.Rows ?? [];
}

export async function getCustomerByCode(params: {
  organisationId: number;
  code: string;
}): Promise<MinimaxCustomer | undefined> {
  try {
    const response = await minimaxFetch<unknown>(
      `/api/orgs/${params.organisationId}/customers/code(${encodeURIComponent(params.code)})`
    );
    return unwrapCustomer(response);
  } catch (error) {
    if (isMinimaxNotFound(error)) return undefined;
    throw error;
  }
}

export async function createCustomer(params: {
  organisationId: number;
  customer: Record<string, unknown>;
}): Promise<MinimaxCustomer> {
  const response = await minimaxFetch<unknown>(`/api/orgs/${params.organisationId}/customers`, {
    method: "POST",
    body: JSON.stringify(params.customer),
  });
  try {
    return unwrapCustomer(response);
  } catch (error) {
    const code = typeof params.customer.Code === "string" ? params.customer.Code : undefined;
    if (code) {
      const customer = await getCustomerByCode({ organisationId: params.organisationId, code });
      if (customer) return customer;
    }
    throw error;
  }
}

export async function getItemByCode(params: {
  organisationId: number;
  code: string;
}): Promise<MinimaxItem | undefined> {
  try {
    const response = await minimaxFetch<unknown>(
      `/api/orgs/${params.organisationId}/items/code(${encodeURIComponent(params.code)})`
    );
    return unwrapItem(response);
  } catch (error) {
    if (isMinimaxNotFound(error)) return undefined;
    throw error;
  }
}

export async function createItem(params: {
  organisationId: number;
  item: Record<string, unknown>;
}): Promise<MinimaxItem> {
  const response = await minimaxFetch<unknown>(`/api/orgs/${params.organisationId}/items`, {
    method: "POST",
    body: JSON.stringify(params.item),
  });
  try {
    return unwrapItem(response);
  } catch (error) {
    const code = typeof params.item.Code === "string" ? params.item.Code : undefined;
    if (code) {
      const item = await getItemByCode({ organisationId: params.organisationId, code });
      if (item) return item;
    }
    throw error;
  }
}

export async function runIssuedInvoiceAction(params: {
  organisationId: number;
  issuedInvoiceId: number;
  rowVersion: string;
  actionName: "generatepdf" | "issueAndGeneratepdf";
}): Promise<void> {
  const rowVersion = encodeURIComponent(params.rowVersion);
  await minimaxFetch(
    `/api/orgs/${params.organisationId}/issuedinvoices/${params.issuedInvoiceId}/actions/${params.actionName}?rowVersion=${rowVersion}`,
    { method: "PUT" }
  );
}

export async function getDocumentAttachment(params: {
  organisationId: number;
  documentId: number;
  attachmentId: number;
}): Promise<MinimaxDocumentAttachment> {
  return minimaxFetch<MinimaxDocumentAttachment>(
    `/api/orgs/${params.organisationId}/documents/${params.documentId}/attachments/${params.attachmentId}`
  );
}

export async function getResource<T>(resourceUrl: string): Promise<T> {
  return minimaxFetch<T>(resourceUrl);
}
