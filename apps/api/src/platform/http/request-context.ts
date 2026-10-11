import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

const WELL_FORMED = /^[\x21-\x7E]{8,128}$/;

type RequestStore = { requestId: string };

const storage = new AsyncLocalStorage<RequestStore>();

export function parseRequestId(incoming: unknown): { value: string; source: "incoming" | "assigned" } {
  if (typeof incoming === "string" && WELL_FORMED.test(incoming)) {
    return { value: incoming, source: "incoming" };
  }
  return { value: randomUUID(), source: "assigned" };
}

export function runWithRequestId<T>(requestId: string, fn: () => T): T {
  return storage.run({ requestId }, fn);
}

export function getRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}
