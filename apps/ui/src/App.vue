<script setup lang="ts">
import cytoscape from "cytoscape";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { api } from "./lib/api";

const events = ref<any[]>([]);
const people = ref<any[]>([]);
const groups = ref<any[]>([]);
const places = ref<any[]>([]);
const errorMessage = ref("");
const isLoading = ref(false);
const stats = ref<{
  totals: {
    events: number;
    people: number;
    groups: number;
    places: number;
  };
  links: {
    event_people: number;
    event_groups: number;
    event_places: number;
  };
} | null>(null);
const graphData = ref<{
  nodes: Array<{ id: string; label: string; type: string }>;
  edges: Array<{ id: string; source: string; target: string; type: string }>;
} | null>(null);

const statusOptions = ["draft", "review", "published"];

const newEvent = reactive({
  title: "",
  event_date: "",
  description: "",
  type: "",
  genre: "",
  series: "",
  tags: "",
  place_text: "",
  slug: "",
  status: "draft",
  notes: "",
});

const newPerson = reactive({
  full_name: "",
  last_name: "",
  first_name: "",
  aka: "",
  role: "",
  bio: "",
  slug: "",
  status: "draft",
});

const newGroup = reactive({
  name: "",
  type: "",
  active_from: "",
  active_to: "",
  bio: "",
  status: "draft",
});

const newPlace = reactive({
  name: "",
  city: "",
  address: "",
  type: "",
  active_from: "",
  active_to: "",
  slug: "",
  status: "draft",
});

const formType = ref<"event" | "person" | "group" | "place">("event");

const linkForm = reactive({
  eventId: "",
  type: "people",
  entityId: "",
});

const viewMode = ref<"list" | "graph">("list");
const graphExpanded = ref(true);
const graphPreviewRef = ref<HTMLDivElement | null>(null);
const graphFullRef = ref<HTMLDivElement | null>(null);
const cyPreview = ref<cytoscape.Core | null>(null);
const cyFull = ref<cytoscape.Core | null>(null);

const searchTerm = ref("");
const sortBy = ref<"date_desc" | "date_asc" | "title_asc" | "title_desc">(
  "date_desc"
);
const expandedIds = ref<Set<string>>(new Set());
const selectedIds = ref<Set<string>>(new Set());
const editableRows = reactive<Record<string, any>>({});

const linkOptions = computed(() => {
  if (linkForm.type === "people") return people.value;
  if (linkForm.type === "groups") return groups.value;
  return places.value;
});

const loadAll = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const [statsRes, graphRes, eventsRes, peopleRes, groupsRes, placesRes] =
      await Promise.all([
        api.getStats(),
        api.getGraph(),
        api.listEvents(),
        api.listPeople(),
        api.listGroups(),
        api.listPlaces(),
      ]);
    stats.value = statsRes;
    graphData.value = graphRes;
    events.value = eventsRes;
    people.value = peopleRes;
    groups.value = groupsRes;
    places.value = placesRes;
    if (!linkForm.eventId && eventsRes[0]) {
      linkForm.eventId = eventsRes[0].id;
    }
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to load data";
  } finally {
    isLoading.value = false;
  }
};

const createEvent = async () => {
  errorMessage.value = "";
  try {
    await api.createEvent({ ...newEvent });
    Object.assign(newEvent, {
      title: "",
      event_date: "",
      description: "",
      type: "",
      genre: "",
      series: "",
      tags: "",
      place_text: "",
      slug: "",
      status: "draft",
      notes: "",
    });
    await loadAll();
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to create event";
  }
};

const createPerson = async () => {
  errorMessage.value = "";
  try {
    await api.createPerson({ ...newPerson });
    Object.assign(newPerson, {
      full_name: "",
      last_name: "",
      first_name: "",
      aka: "",
      role: "",
      bio: "",
      slug: "",
      status: "draft",
    });
    await loadAll();
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to create person";
  }
};

const createGroup = async () => {
  errorMessage.value = "";
  try {
    await api.createGroup({ ...newGroup });
    Object.assign(newGroup, {
      name: "",
      type: "",
      active_from: "",
      active_to: "",
      bio: "",
      status: "draft",
    });
    await loadAll();
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to create group";
  }
};

const createPlace = async () => {
  errorMessage.value = "";
  try {
    await api.createPlace({ ...newPlace });
    Object.assign(newPlace, {
      name: "",
      city: "",
      address: "",
      type: "",
      active_from: "",
      active_to: "",
      slug: "",
      status: "draft",
    });
    await loadAll();
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to create place";
  }
};

const linkEntity = async () => {
  if (!linkForm.eventId || !linkForm.entityId) {
    errorMessage.value = "Select an event and an entity to link.";
    return;
  }
  errorMessage.value = "";
  try {
    await api.linkEvent(linkForm.eventId, linkForm.type, [linkForm.entityId]);
    linkForm.entityId = "";
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to link entity";
  }
};

const filteredEvents = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  let list = [...events.value];
  if (term) {
    list = list.filter((event) => {
      const haystack = [
        event.title,
        event.type,
        event.genre,
        event.series,
        event.place_text,
        event.slug,
        event.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }
  list.sort((a, b) => {
    if (sortBy.value === "title_asc") {
      return (a.title || "").localeCompare(b.title || "");
    }
    if (sortBy.value === "title_desc") {
      return (b.title || "").localeCompare(a.title || "");
    }
    const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
    const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
    if (sortBy.value === "date_asc") return dateA - dateB;
    return dateB - dateA;
  });
  return list;
});

const toggleExpanded = (id: string) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
    if (!editableRows[id]) {
      const event = events.value.find((item) => item.id === id);
      if (event) editableRows[id] = { ...event, tags: event.tags?.join(", ") };
    }
  }
};

const toggleSelected = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
};

const toggleSelectAll = () => {
  if (selectedIds.value.size === filteredEvents.value.length) {
    selectedIds.value.clear();
  } else {
    selectedIds.value = new Set(filteredEvents.value.map((event) => event.id));
  }
};

const saveEvent = async (id: string) => {
  const data = editableRows[id];
  if (!data) return;
  errorMessage.value = "";
  try {
    await api.updateEvent(id, data);
    await loadAll();
  } catch (error: any) {
    errorMessage.value = error.message || "Failed to update event";
  }
};

const clearSelection = () => {
  selectedIds.value.clear();
};

const buildGraphElements = () => {
  if (!graphData.value) return [];
  const elements: cytoscape.ElementDefinition[] = [];
  for (const node of graphData.value.nodes) {
    elements.push({
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
      },
    });
  }
  for (const edge of graphData.value.edges) {
    elements.push({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      },
    });
  }
  return elements;
};

const renderGraph = (
  container: HTMLDivElement | null,
  instance: typeof cyPreview
) => {
  if (!container) return;
  const elements = buildGraphElements();
  if (instance.value) {
    instance.value.json({ elements });
    instance.value.layout({ name: "cose", animate: false }).run();
    instance.value.resize();
    instance.value.fit(undefined, 24);
    return;
  }
  instance.value = cytoscape({
    container,
    elements,
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "text-wrap": "wrap",
          "text-max-width": "120px",
          "font-size": "10px",
          color: "#e5e7eb",
          "text-outline-width": 2,
          "text-outline-color": "#0b0c10",
        },
      },
      {
        selector: 'node[type = "event"]',
        style: {
          "background-color": "#4f8bff",
          width: "36px",
          height: "36px",
        },
      },
      {
        selector: 'node[type = "person"]',
        style: {
          "background-color": "#22c55e",
          width: "24px",
          height: "24px",
        },
      },
      {
        selector: 'node[type = "group"]',
        style: {
          "background-color": "#f97316",
          width: "26px",
          height: "26px",
        },
      },
      {
        selector: 'node[type = "place"]',
        style: {
          "background-color": "#fbbf24",
          width: "28px",
          height: "28px",
        },
      },
      {
        selector: "edge",
        style: {
          width: 1,
          "line-color": "#39405a",
          "target-arrow-color": "#39405a",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
        },
      },
    ],
    layout: { name: "cose", animate: false },
    wheelSensitivity: 0.2,
  });
  instance.value.resize();
  instance.value.fit(undefined, 24);
};

watch(
  () => graphData.value,
  () => {
    renderGraph(graphPreviewRef.value, cyPreview);
    if (viewMode.value === "graph") {
      renderGraph(graphFullRef.value, cyFull);
    }
  },
  { deep: true }
);

watch(viewMode, () => {
  if (viewMode.value === "graph") {
    setTimeout(() => renderGraph(graphFullRef.value, cyFull), 0);
  } else {
    setTimeout(() => renderGraph(graphPreviewRef.value, cyPreview), 0);
  }
});

onMounted(() => {
  loadAll();
  window.addEventListener("resize", () => {
    renderGraph(graphPreviewRef.value, cyPreview);
    if (viewMode.value === "graph") {
      renderGraph(graphFullRef.value, cyFull);
    }
  });
});
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>Storytelli Data Builder</h1>
        <p>
          Insert and link historical data for events, people, groups, and
          places.
        </p>
      </div>
      <div class="header-meta">
        <div class="stat">
          <span class="muted">Events</span>
          <strong>{{ stats?.totals.events ?? events.length }}</strong>
        </div>
        <div class="stat">
          <span class="muted">People</span>
          <strong>{{ stats?.totals.people ?? people.length }}</strong>
        </div>
        <div class="stat">
          <span class="muted">Groups</span>
          <strong>{{ stats?.totals.groups ?? groups.length }}</strong>
        </div>
        <div class="stat">
          <span class="muted">Places</span>
          <strong>{{ stats?.totals.places ?? places.length }}</strong>
        </div>
        <div class="stat">
          <span class="muted">Event ↔ People</span>
          <strong>{{ stats?.links.event_people ?? 0 }}</strong>
        </div>
        <div class="stat">
          <span class="muted">Event ↔ Groups</span>
          <strong>{{ stats?.links.event_groups ?? 0 }}</strong>
        </div>
        <div class="stat">
          <span class="muted">Event ↔ Places</span>
          <strong>{{ stats?.links.event_places ?? 0 }}</strong>
        </div>
      </div>
    </header>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="muted">Loading data…</p>

    <div class="dashboard">
      <aside class="sidebar">
        <section class="card">
      <div class="card-header">
  <div>
          <h2>Create record</h2>
          <p class="muted">
            Switch type, keep focus, and input everything from one place.
          </p>
        </div>
        <div class="tabs">
          <button
            class="tab"
            :class="{ active: formType === 'event' }"
            @click="formType = 'event'"
          >
            Event
          </button>
          <button
            class="tab"
            :class="{ active: formType === 'person' }"
            @click="formType = 'person'"
          >
            Person
          </button>
          <button
            class="tab"
            :class="{ active: formType === 'group' }"
            @click="formType = 'group'"
          >
            Group
          </button>
          <button
            class="tab"
            :class="{ active: formType === 'place' }"
            @click="formType = 'place'"
          >
            Place
          </button>
        </div>
      </div>

      <div v-if="formType === 'event'" class="grid">
        <label>
          Title
          <input v-model="newEvent.title" placeholder="Event title" />
        </label>
        <label>
          Date
          <input v-model="newEvent.event_date" type="date" />
        </label>
        <label>
          Type
          <input v-model="newEvent.type" placeholder="Concerto, performance" />
        </label>
        <label>
          Genre
          <input v-model="newEvent.genre" placeholder="Sperimentale" />
        </label>
        <label>
          Series
          <input v-model="newEvent.series" placeholder="Evento-Rassegna" />
        </label>
        <label>
          Tags
          <input v-model="newEvent.tags" placeholder="tag1, tag2" />
        </label>
        <label>
          Place (free text)
          <input v-model="newEvent.place_text" placeholder="Luogo" />
        </label>
        <label>
          Slug
          <input v-model="newEvent.slug" />
        </label>
        <label>
          Status
          <select v-model="newEvent.status">
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>
        <label class="full">
          Description
          <textarea v-model="newEvent.description" rows="3"></textarea>
        </label>
        <label class="full">
          Notes
          <textarea v-model="newEvent.notes" rows="2"></textarea>
        </label>
        <div class="actions">
          <button @click="createEvent">Save event</button>
        </div>
      </div>

      <div v-else-if="formType === 'person'" class="grid">
        <label>
          Full name
          <input v-model="newPerson.full_name" />
        </label>
        <label>
          First name
          <input v-model="newPerson.first_name" />
        </label>
        <label>
          Last name
          <input v-model="newPerson.last_name" />
        </label>
        <label>
          Aka
          <input v-model="newPerson.aka" />
        </label>
        <label>
          Role
          <input v-model="newPerson.role" />
        </label>
        <label>
          Status
          <select v-model="newPerson.status">
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>
        <label class="full">
          Bio
          <textarea v-model="newPerson.bio" rows="2"></textarea>
        </label>
        <div class="actions">
          <button @click="createPerson">Save person</button>
        </div>
      </div>

      <div v-else-if="formType === 'group'" class="grid">
        <label>
          Name
          <input v-model="newGroup.name" />
        </label>
        <label>
          Type
          <input v-model="newGroup.type" />
        </label>
        <label>
          Active from
          <input v-model="newGroup.active_from" type="date" />
        </label>
        <label>
          Active to
          <input v-model="newGroup.active_to" type="date" />
        </label>
        <label>
          Status
          <select v-model="newGroup.status">
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>
        <label class="full">
          Bio
          <textarea v-model="newGroup.bio" rows="2"></textarea>
        </label>
        <div class="actions">
          <button @click="createGroup">Save group</button>
        </div>
      </div>

      <div v-else class="grid">
        <label>
          Name
          <input v-model="newPlace.name" />
        </label>
        <label>
          City
          <input v-model="newPlace.city" />
        </label>
        <label>
          Address
          <input v-model="newPlace.address" />
        </label>
        <label>
          Type
          <input v-model="newPlace.type" />
        </label>
        <label>
          Active from
          <input v-model="newPlace.active_from" type="date" />
        </label>
        <label>
          Active to
          <input v-model="newPlace.active_to" type="date" />
        </label>
        <label>
          Status
          <select v-model="newPlace.status">
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>
        <div class="actions">
          <button @click="createPlace">Save place</button>
        </div>
      </div>
        </section>

        <section class="card">
          <h2>Link entities to event</h2>
          <div class="grid">
            <label>
              Event
              <select v-model="linkForm.eventId">
                <option value="" disabled>Select event</option>
                <option v-for="event in events" :key="event.id" :value="event.id">
                  {{ event.title }}
                </option>
              </select>
            </label>
            <label>
              Type
              <select v-model="linkForm.type">
                <option value="people">Person</option>
                <option value="groups">Group</option>
                <option value="places">Place</option>
              </select>
            </label>
            <label>
              Entity
              <select v-model="linkForm.entityId">
                <option value="" disabled>Select entity</option>
                <option
                  v-for="entity in linkOptions"
                  :key="entity.id"
                  :value="entity.id"
                >
                  {{ entity.full_name || entity.name }}
                </option>
              </select>
            </label>
          </div>
          <button @click="linkEntity">Link</button>
        </section>

        <section class="card">
          <div class="card-header compact">
            <div>
              <h2>Graph view</h2>
              <p class="muted">Explore event ↔ place connections.</p>
            </div>
            <button class="ghost small" @click="graphExpanded = !graphExpanded">
              {{ graphExpanded ? "Hide" : "Show" }}
            </button>
          </div>
          <div v-if="graphExpanded" class="graph-preview">
            <div ref="graphPreviewRef" class="graph-canvas"></div>
            <button @click="viewMode = 'graph'">Open full page</button>
          </div>
        </section>
      </aside>

      <main class="content">
        <section v-if="viewMode === 'graph'" class="card graph-full">
          <div class="toolbar">
            <div class="controls">
              <button class="ghost" @click="viewMode = 'list'">
                Back to list
              </button>
              <span class="muted">Graph navigation</span>
            </div>
          </div>
          <div ref="graphFullRef" class="graph-canvas graph-full-canvas"></div>
        </section>

        <section v-else class="card">
          <div class="toolbar">
            <div class="search">
              <input
                v-model="searchTerm"
                placeholder="Search by title, type, place, tag…"
              />
            </div>
            <div class="controls">
              <label>
                Sort
                <select v-model="sortBy">
                  <option value="date_desc">Date (newest)</option>
                  <option value="date_asc">Date (oldest)</option>
                  <option value="title_asc">Title (A → Z)</option>
                  <option value="title_desc">Title (Z → A)</option>
                </select>
              </label>
              <button class="ghost" @click="clearSelection">
                Clear selection
              </button>
              <button class="ghost" disabled>
                Batch: Tag
              </button>
              <button class="ghost" disabled>
                Batch: Status
              </button>
            </div>
          </div>

          <div class="list">
            <div class="list-header">
              <label class="checkbox">
                <input
                  type="checkbox"
                  :checked="selectedIds.size === filteredEvents.length"
                  @change="toggleSelectAll"
                />
                <span>Select all</span>
              </label>
              <span class="muted">{{ filteredEvents.length }} results</span>
            </div>

            <article
              v-for="event in filteredEvents"
              :key="event.id"
              class="row"
            >
              <div class="row-main">
                <label class="checkbox">
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(event.id)"
                    @change="toggleSelected(event.id)"
                  />
                </label>
                <button class="expand" @click="toggleExpanded(event.id)">
                  {{ expandedIds.has(event.id) ? "−" : "+" }}
                </button>
                <div class="row-content">
                  <strong>{{ event.title || "Untitled event" }}</strong>
                  <p class="muted">
                    {{ event.event_date || "No date" }} ·
                    {{ event.type || "No type" }}
                  </p>
                </div>
                <span class="pill">{{ event.status || "draft" }}</span>
              </div>

              <div v-if="expandedIds.has(event.id)" class="row-detail">
                <div class="grid">
                  <label>
                    Title
                    <input v-model="editableRows[event.id].title" />
                  </label>
                  <label>
                    Date
                    <input
                      v-model="editableRows[event.id].event_date"
                      type="date"
                    />
                  </label>
                  <label>
                    Type
                    <input v-model="editableRows[event.id].type" />
                  </label>
                  <label>
                    Genre
                    <input v-model="editableRows[event.id].genre" />
                  </label>
                  <label>
                    Series
                    <input v-model="editableRows[event.id].series" />
                  </label>
                  <label>
                    Tags
                    <input v-model="editableRows[event.id].tags" />
                  </label>
                  <label>
                    Place
                    <input v-model="editableRows[event.id].place_text" />
                  </label>
                  <label>
                    Slug
                    <input v-model="editableRows[event.id].slug" />
                  </label>
                  <label>
                    Status
                    <select v-model="editableRows[event.id].status">
                      <option value="">(none)</option>
                      <option
                        v-for="status in statusOptions"
                        :key="status"
                        :value="status"
                      >
                        {{ status }}
                      </option>
                    </select>
                  </label>
                  <label class="full">
                    Description
                    <textarea
                      v-model="editableRows[event.id].description"
                      rows="3"
                    ></textarea>
                  </label>
                  <label class="full">
                    Notes
                    <textarea
                      v-model="editableRows[event.id].notes"
                      rows="2"
                    ></textarea>
                  </label>
                </div>
                <div class="actions">
                  <button @click="saveEvent(event.id)">Save changes</button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: "Inter", system-ui, sans-serif;
  background: #0b0c10;
  color: #f3f4f6;
}

.page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 20px 80px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 10px;
  background: #101521;
  border: 1px solid #24293a;
  min-width: 110px;
}

.dashboard {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content {
  min-width: 0;
}

header h1 {
  margin: 0 0 8px;
}

header p {
  margin: 0;
  color: #5a5a65;
}

.card {
  background: #14161f;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.35);
  border: 1px solid #202434;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
}

.grid input,
.grid select,
.grid textarea {
  border: 1px solid #2d3145;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.95rem;
  font-family: inherit;
  background: #0f111a;
  color: #f3f4f6;
}

.grid textarea {
  resize: vertical;
}

.grid .full {
  grid-column: 1 / -1;
}

button {
  border: none;
  background: #4f8bff;
  color: #fff;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

button:hover {
  background: #3a6ee0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  border: 1px solid #24293a;
  border-radius: 10px;
  padding: 12px 14px;
  background: #101521;
}

.muted {
  color: #9aa1b2;
  margin: 6px 0 0;
}

.error {
  color: #fda29b;
  background: #2a1116;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #7a1a25;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.card-header.compact {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tab {
  background: #1b2131;
  color: #cbd5f5;
  border: 1px solid #2a3146;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.9rem;
}

.tab.active {
  background: #4f8bff;
  border-color: #4f8bff;
  color: #fff;
}

.actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}

.search input {
  width: 100%;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.controls label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.ghost {
  background: transparent;
  border: 1px solid #2a3146;
  color: #cbd5f5;
}

.ghost:hover {
  background: #1b2131;
}

.ghost.small {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.row {
  border: 1px solid #24293a;
  border-radius: 12px;
  padding: 12px 14px;
  background: #101521;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.row-main {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 12px;
  align-items: center;
}

.row-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.expand {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #1b2131;
  border: 1px solid #2a3146;
  color: #cbd5f5;
  font-size: 1.2rem;
}

.pill {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid #2a3146;
  color: #cbd5f5;
  font-size: 0.8rem;
}

.row-detail {
  border-top: 1px solid #24293a;
  padding-top: 12px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox input {
  accent-color: #4f8bff;
}

.graph-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.graph-canvas {
  width: 100%;
  height: 240px;
  border-radius: 12px;
  border: 1px solid #24293a;
  background: #0f111a;
}

.graph-full {
  min-height: 520px;
  height: calc(100vh - 260px);
  display: flex;
  flex-direction: column;
}

.graph-full-canvas {
  flex: 1;
  min-height: 420px;
  width: 100%;
}

@media (max-width: 960px) {
  .dashboard {
    grid-template-columns: 1fr;
  }

  .sidebar,
  .content {
    width: 100%;
  }
}
</style>
