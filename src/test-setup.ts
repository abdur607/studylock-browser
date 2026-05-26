import { beforeEach, vi } from "vitest";

// In-memory store shared by all chrome.storage mock functions via closure.
// Reassigned in beforeEach so each test starts with a clean slate.
let store: Record<string, unknown> = {};

const mockStorageGet = (key: string, callback: (result: Record<string, unknown>) => void) => {
  callback({ [key]: store[key] });
};

const mockStorageSet = (data: Record<string, unknown>, callback: () => void) => {
  Object.assign(store, data);
  callback();
};

const mockStorageClear = (callback: () => void) => {
  store = {};
  callback();
};

(globalThis as unknown as { chrome: unknown }).chrome = {
  storage: {
    local: {
      get: mockStorageGet,
      set: mockStorageSet,
      clear: mockStorageClear
    }
  },
  tabs: {
    query: vi.fn().mockResolvedValue([])
  }
};

beforeEach(() => {
  store = {};
  // Reset chrome.tabs.query to default empty result before each test.
  // Individual tests can override with their own mockResolvedValue.
  (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});
