<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { api } from "./lib/api";

const events = ref<any[]>([]);
const people = ref<any[]>([]);
const groups = ref<any[]>([]);
const places = ref<any[]>([]);
const errorMessage = ref("");
const isLoading = ref(false);

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
  status: "",
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
  status: "",
});

const newGroup = reactive({
  name: "",
  type: "",
  active_from: "",
  active_to: "",
  bio: "",
  status: "",
});

const newPlace = reactive({
  name: "",
  city: "",
  address: "",
  type: "",
  active_from: "",
  active_to: "",
  slug: "",
  status: "",
});

const linkForm = reactive({
  eventId: "",
  type: "people",
  entityId: "",
});

const linkOptions = computed(() => {
  if (linkForm.type === "people") return people.value;
  if (linkForm.type === "groups") return groups.value;
  return places.value;
});

const loadAll = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const [eventsRes, peopleRes, groupsRes, placesRes] = await Promise.all([
      api.listEvents(),
      api.listPeople(),
      api.listGroups(),
      api.listPlaces(),
    ]);
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
      status: "",
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
      status: "",
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
      status: "",
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
      status: "",
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

onMounted(loadAll);
</script>

<template>
  <div class="page">
    <header>
      <h1>GLESSI Data Builder</h1>
      <p>
        Insert and link historical data for events, people, groups, and places.
      </p>
    </header>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="isLoading" class="muted">Loading data…</p>

    <section class="card">
      <h2>Add event</h2>
      <div class="grid">
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
          <input v-model="newEvent.status" />
        </label>
        <label class="full">
          Description
          <textarea v-model="newEvent.description" rows="3"></textarea>
        </label>
        <label class="full">
          Notes
          <textarea v-model="newEvent.notes" rows="2"></textarea>
        </label>
      </div>
      <button @click="createEvent">Save event</button>
    </section>

    <section class="card">
      <h2>Add person</h2>
      <div class="grid">
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
          <input v-model="newPerson.status" />
        </label>
        <label class="full">
          Bio
          <textarea v-model="newPerson.bio" rows="2"></textarea>
        </label>
      </div>
      <button @click="createPerson">Save person</button>
    </section>

    <section class="card">
      <h2>Add group</h2>
      <div class="grid">
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
          <input v-model="newGroup.status" />
        </label>
        <label class="full">
          Bio
          <textarea v-model="newGroup.bio" rows="2"></textarea>
        </label>
      </div>
      <button @click="createGroup">Save group</button>
    </section>

    <section class="card">
      <h2>Add place</h2>
      <div class="grid">
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
          <input v-model="newPlace.status" />
        </label>
      </div>
      <button @click="createPlace">Save place</button>
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
            <option v-for="entity in linkOptions" :key="entity.id" :value="entity.id">
              {{ entity.full_name || entity.name }}
            </option>
          </select>
        </label>
      </div>
      <button @click="linkEntity">Link</button>
    </section>

    <section class="card">
      <h2>Events</h2>
      <div class="list">
        <article v-for="event in events" :key="event.id" class="list-item">
          <div>
            <strong>{{ event.title }}</strong>
            <p class="muted">
              {{ event.event_date || "No date" }} · {{ event.type || "No type" }}
            </p>
            <p v-if="event.description">{{ event.description }}</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: "Inter", system-ui, sans-serif;
  background: #f6f6f8;
  color: #1b1b1f;
}

.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px 80px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

header h1 {
  margin: 0 0 8px;
}

header p {
  margin: 0;
  color: #5a5a65;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
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
  border: 1px solid #d7d7df;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.95rem;
  font-family: inherit;
}

.grid textarea {
  resize: vertical;
}

.grid .full {
  grid-column: 1 / -1;
}

button {
  border: none;
  background: #2f6fed;
  color: #fff;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

button:hover {
  background: #2659c6;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  border: 1px solid #e4e4ee;
  border-radius: 10px;
  padding: 12px 14px;
  background: #fbfbfd;
}

.muted {
  color: #6c6c78;
  margin: 6px 0 0;
}

.error {
  color: #b42318;
  background: #fef3f2;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #fecdca;
}
</style>
