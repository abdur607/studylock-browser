import { addItem, createId, getActiveSession, removeItem, updateItem } from "./storage";
import { getDomainFromUrl } from "./domainUtils";
import { incrementSessionCounter } from "./sessionManager";
import { STORAGE_KEYS, TabGroup } from "./types";

export async function saveCurrentTabs(courseName: string, name: string, task?: string): Promise<TabGroup> {
  const active = await getActiveSession();
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const group: TabGroup = {
    id: createId("tabs"),
    courseName,
    name,
    task,
    sessionId: active?.id,
    tabs: tabs
      .filter((tab) => Boolean(tab.url?.startsWith("http")))
      .map((tab) => ({ title: tab.title ?? "Untitled", url: tab.url ?? "", domain: getDomainFromUrl(tab.url ?? "") })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  await addItem(STORAGE_KEYS.tabGroups, group);
  if (active) await incrementSessionCounter(active.id, "tabGroupsSavedCount");
  return group;
}

export async function restoreTabGroup(group: TabGroup): Promise<void> {
  for (const tab of group.tabs) {
    await chrome.tabs.create({ url: tab.url, active: false });
  }
}

export async function renameTabGroup(id: string, name: string): Promise<void> {
  await updateItem<TabGroup>(STORAGE_KEYS.tabGroups, id, { name, updatedAt: new Date().toISOString() });
}

export async function deleteTabGroup(id: string): Promise<void> {
  await removeItem(STORAGE_KEYS.tabGroups, id);
}
