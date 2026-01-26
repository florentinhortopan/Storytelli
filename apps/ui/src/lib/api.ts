const apiBase = import.meta.env.VITE_API_BASE_URL || "";

type EventInput = {
  title: string;
  event_date?: string;
  description?: string;
  type?: string;
  genre?: string;
  series?: string;
  tags?: string;
  place_text?: string;
  slug?: string;
  status?: string;
  notes?: string;
};

type Event = {
  id: string;
  title?: string;
  event_date?: string;
  description?: string;
  type?: string;
  genre?: string;
  series?: string;
  tags?: string[] | null;
  place_text?: string;
  slug?: string;
  status?: string;
  notes?: string;
};

type PersonInput = {
  full_name: string;
  last_name?: string;
  first_name?: string;
  aka?: string;
  role?: string;
  bio?: string;
  slug?: string;
  status?: string;
};

type Person = {
  id: string;
  full_name?: string;
  last_name?: string;
  first_name?: string;
  aka?: string;
  role?: string;
  bio?: string;
  slug?: string;
  status?: string;
};

type GroupInput = {
  name: string;
  type?: string;
  active_from?: string;
  active_to?: string;
  bio?: string;
  status?: string;
};

type Group = {
  id: string;
  name?: string;
  type?: string;
  active_from?: string;
  active_to?: string;
  bio?: string;
  status?: string;
};

type PlaceInput = {
  name?: string;
  city?: string;
  address?: string;
  type?: string;
  active_from?: string;
  active_to?: string;
  slug?: string;
  status?: string;
};

type Place = {
  id: string;
  name?: string;
  city?: string;
  address?: string;
  type?: string;
  active_from?: string;
  active_to?: string;
  slug?: string;
  status?: string;
};

const request = async <T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> => {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return response.json();
};

export const api = {
  listEvents: () => request<Event[]>("/api/events"),
  createEvent: (data: EventInput) =>
    request("/api/events", { method: "POST", body: JSON.stringify(data) }),
  listPeople: () => request<Person[]>("/api/people"),
  createPerson: (data: PersonInput) =>
    request("/api/people", { method: "POST", body: JSON.stringify(data) }),
  listGroups: () => request<Group[]>("/api/groups"),
  createGroup: (data: GroupInput) =>
    request("/api/groups", { method: "POST", body: JSON.stringify(data) }),
  listPlaces: () => request<Place[]>("/api/places"),
  createPlace: (data: PlaceInput) =>
    request("/api/places", { method: "POST", body: JSON.stringify(data) }),
  linkEvent: (eventId: string, type: string, ids: string[]) =>
    request(`/api/events/${eventId}/links`, {
      method: "POST",
      body: JSON.stringify({ type, ids }),
    }),
  listEventLinks: (eventId: string) =>
    request<{
      people: Person[];
      groups: Group[];
      places: Place[];
    }>(`/api/events/${eventId}/links`),
};

export type {
  Event,
  EventInput,
  Person,
  PersonInput,
  Group,
  GroupInput,
  Place,
  PlaceInput,
};
