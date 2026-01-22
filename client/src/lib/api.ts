import type { DraftSession, InsertDraftSession, UpdateDraftSession, UserPreferences, InsertUserPreferences, UpdateUserPreferences } from "@shared/schema";

// Draft Sessions API
export async function getDraftSessions(userId?: string): Promise<DraftSession[]> {
  const params = userId ? `?userId=${userId}` : '';
  const response = await fetch(`/api/draft-sessions${params}`);
  if (!response.ok) throw new Error('Failed to fetch draft sessions');
  return response.json();
}

export async function getDraftSession(id: string): Promise<DraftSession> {
  const response = await fetch(`/api/draft-sessions/${id}`);
  if (!response.ok) throw new Error('Failed to fetch draft session');
  return response.json();
}

export async function createDraftSession(session: InsertDraftSession): Promise<DraftSession> {
  const response = await fetch('/api/draft-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  if (!response.ok) throw new Error('Failed to create draft session');
  return response.json();
}

export async function updateDraftSession(id: string, session: UpdateDraftSession): Promise<DraftSession> {
  const response = await fetch(`/api/draft-sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  if (!response.ok) throw new Error('Failed to update draft session');
  return response.json();
}

export async function deleteDraftSession(id: string): Promise<void> {
  const response = await fetch(`/api/draft-sessions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete draft session');
}

// User Preferences API
export async function getUserPreferences(userId?: string): Promise<UserPreferences | null> {
  const params = userId ? `?userId=${userId}` : '';
  const response = await fetch(`/api/preferences${params}`);
  if (!response.ok) throw new Error('Failed to fetch preferences');
  return response.json();
}

export async function createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
  const response = await fetch('/api/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!response.ok) throw new Error('Failed to create preferences');
  return response.json();
}

export async function updateUserPreferences(id: string, prefs: UpdateUserPreferences): Promise<UserPreferences> {
  const response = await fetch(`/api/preferences/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  });
  if (!response.ok) throw new Error('Failed to update preferences');
  return response.json();
}
