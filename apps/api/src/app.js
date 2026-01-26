const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json({ limit: "2mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

const parseTags = (tags) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string" && tags.trim()) {
    return tags.split(",").map((tag) => tag.trim());
  }
  return null;
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/stats", async (req, res) => {
  const [
    events,
    people,
    groups,
    places,
    eventPeople,
    eventGroups,
    eventPlaces,
  ] = await Promise.all([
    db.query("SELECT COUNT(*)::int AS count FROM events"),
    db.query("SELECT COUNT(*)::int AS count FROM people"),
    db.query("SELECT COUNT(*)::int AS count FROM groups"),
    db.query("SELECT COUNT(*)::int AS count FROM places"),
    db.query("SELECT COUNT(*)::int AS count FROM event_people"),
    db.query("SELECT COUNT(*)::int AS count FROM event_groups"),
    db.query("SELECT COUNT(*)::int AS count FROM event_places"),
  ]);

  res.json({
    totals: {
      events: events.rows[0].count,
      people: people.rows[0].count,
      groups: groups.rows[0].count,
      places: places.rows[0].count,
    },
    links: {
      event_people: eventPeople.rows[0].count,
      event_groups: eventGroups.rows[0].count,
      event_places: eventPlaces.rows[0].count,
    },
  });
});

app.get("/api/graph", async (req, res) => {
  const [
    events,
    people,
    groups,
    places,
    eventPeople,
    eventGroups,
    eventPlaces,
  ] = await Promise.all([
    db.query("SELECT id, title FROM events"),
    db.query("SELECT id, full_name FROM people"),
    db.query("SELECT id, name FROM groups"),
    db.query("SELECT id, name FROM places"),
    db.query("SELECT event_id, person_id FROM event_people"),
    db.query("SELECT event_id, group_id FROM event_groups"),
    db.query("SELECT event_id, place_id FROM event_places"),
  ]);

  const nodes = [
    ...events.rows.map((row) => ({
      id: `event:${row.id}`,
      label: row.title || "Untitled event",
      type: "event",
    })),
    ...people.rows.map((row) => ({
      id: `person:${row.id}`,
      label: row.full_name || "Unnamed person",
      type: "person",
    })),
    ...groups.rows.map((row) => ({
      id: `group:${row.id}`,
      label: row.name || "Unnamed group",
      type: "group",
    })),
    ...places.rows.map((row) => ({
      id: `place:${row.id}`,
      label: row.name || "Unnamed place",
      type: "place",
    })),
  ];

  const edges = [
    ...eventPeople.rows.map((row) => ({
      id: `event:${row.event_id}__person:${row.person_id}`,
      source: `event:${row.event_id}`,
      target: `person:${row.person_id}`,
      type: "event_person",
    })),
    ...eventGroups.rows.map((row) => ({
      id: `event:${row.event_id}__group:${row.group_id}`,
      source: `event:${row.event_id}`,
      target: `group:${row.group_id}`,
      type: "event_group",
    })),
    ...eventPlaces.rows.map((row) => ({
      id: `event:${row.event_id}__place:${row.place_id}`,
      source: `event:${row.event_id}`,
      target: `place:${row.place_id}`,
      type: "event_place",
    })),
  ];

  res.json({ nodes, edges });
});

app.get("/api/events", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM events ORDER BY event_date NULLS LAST, title ASC"
  );
  res.json(result.rows);
});

app.post("/api/events", async (req, res) => {
  const data = pick(req.body, [
    "title",
    "event_date",
    "description",
    "type",
    "genre",
    "series",
    "tags",
    "place_text",
    "slug",
    "status",
    "notes",
  ]);
  data.tags = parseTags(data.tags);
  const result = await db.query(
    `INSERT INTO events
      (title, event_date, description, type, genre, series, tags, place_text, slug, status, notes)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      data.title,
      data.event_date || null,
      data.description || null,
      data.type || null,
      data.genre || null,
      data.series || null,
      data.tags,
      data.place_text || null,
      data.slug || null,
      data.status || null,
      data.notes || null,
    ]
  );
  res.status(201).json(result.rows[0]);
});

app.put("/api/events/:id", async (req, res) => {
  const data = pick(req.body, [
    "title",
    "event_date",
    "description",
    "type",
    "genre",
    "series",
    "tags",
    "place_text",
    "slug",
    "status",
    "notes",
  ]);
  if (data.tags !== undefined) data.tags = parseTags(data.tags);
  if (data.status === "") data.status = null;
  const fields = Object.keys(data);
  if (!fields.length) {
    return res.status(400).json({ error: "No fields to update" });
  }
  const setClause = fields
    .map((field, idx) => `${field} = $${idx + 1}`)
    .concat(`updated_at = now()`)
    .join(", ");
  const values = fields.map((field) => data[field]);
  const result = await db.query(
    `UPDATE events SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, req.params.id]
  );
  res.json(result.rows[0]);
});

app.get("/api/people", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM people ORDER BY full_name ASC"
  );
  res.json(result.rows);
});

app.post("/api/people", async (req, res) => {
  const data = pick(req.body, [
    "full_name",
    "last_name",
    "first_name",
    "aka",
    "role",
    "bio",
    "slug",
    "status",
  ]);
  const result = await db.query(
    `INSERT INTO people
      (full_name, last_name, first_name, aka, role, bio, slug, status)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      data.full_name,
      data.last_name || null,
      data.first_name || null,
      data.aka || null,
      data.role || null,
      data.bio || null,
      data.slug || null,
      data.status || null,
    ]
  );
  res.status(201).json(result.rows[0]);
});

app.get("/api/groups", async (req, res) => {
  const result = await db.query("SELECT * FROM groups ORDER BY name ASC");
  res.json(result.rows);
});

app.post("/api/groups", async (req, res) => {
  const data = pick(req.body, [
    "name",
    "type",
    "active_from",
    "active_to",
    "bio",
    "status",
  ]);
  const result = await db.query(
    `INSERT INTO groups
      (name, type, active_from, active_to, bio, status)
     VALUES
      ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      data.name,
      data.type || null,
      data.active_from || null,
      data.active_to || null,
      data.bio || null,
      data.status || null,
    ]
  );
  res.status(201).json(result.rows[0]);
});

app.get("/api/places", async (req, res) => {
  const result = await db.query("SELECT * FROM places ORDER BY name ASC");
  res.json(result.rows);
});

app.post("/api/places", async (req, res) => {
  const data = pick(req.body, [
    "name",
    "city",
    "address",
    "type",
    "active_from",
    "active_to",
    "slug",
    "status",
  ]);
  const result = await db.query(
    `INSERT INTO places
      (name, city, address, type, active_from, active_to, slug, status)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      data.name || null,
      data.city || null,
      data.address || null,
      data.type || null,
      data.active_from || null,
      data.active_to || null,
      data.slug || null,
      data.status || null,
    ]
  );
  res.status(201).json(result.rows[0]);
});

app.get("/api/organizations", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM organizations ORDER BY name ASC"
  );
  res.json(result.rows);
});

app.post("/api/organizations", async (req, res) => {
  const data = pick(req.body, ["name", "type", "slug", "status"]);
  const result = await db.query(
    `INSERT INTO organizations
      (name, type, slug, status)
     VALUES
      ($1,$2,$3,$4)
     RETURNING *`,
    [
      data.name,
      data.type || null,
      data.slug || null,
      data.status || null,
    ]
  );
  res.status(201).json(result.rows[0]);
});

app.get("/api/sources", async (req, res) => {
  const result = await db.query("SELECT * FROM sources ORDER BY title ASC");
  res.json(result.rows);
});

app.post("/api/sources", async (req, res) => {
  const data = pick(req.body, ["type", "title", "status"]);
  const result = await db.query(
    `INSERT INTO sources
      (type, title, status)
     VALUES
      ($1,$2,$3)
     RETURNING *`,
    [data.type || null, data.title, data.status || null]
  );
  res.status(201).json(result.rows[0]);
});

app.get("/api/media", async (req, res) => {
  const result = await db.query("SELECT * FROM media ORDER BY title ASC");
  res.json(result.rows);
});

app.post("/api/media", async (req, res) => {
  const data = pick(req.body, ["type", "title", "slug"]);
  const result = await db.query(
    `INSERT INTO media
      (type, title, slug)
     VALUES
      ($1,$2,$3)
     RETURNING *`,
    [data.type || null, data.title, data.slug || null]
  );
  res.status(201).json(result.rows[0]);
});

app.get("/api/online-resources", async (req, res) => {
  const result = await db.query(
    "SELECT * FROM online_resources ORDER BY title ASC"
  );
  res.json(result.rows);
});

app.post("/api/online-resources", async (req, res) => {
  const data = pick(req.body, ["type", "title", "url", "status"]);
  const result = await db.query(
    `INSERT INTO online_resources
      (type, title, url, status)
     VALUES
      ($1,$2,$3,$4)
     RETURNING *`,
    [data.type || null, data.title, data.url || null, data.status || null]
  );
  res.status(201).json(result.rows[0]);
});

app.post("/api/events/:id/links", async (req, res) => {
  const { type, ids } = req.body;
  const supported = {
    people: { table: "event_people", column: "person_id" },
    groups: { table: "event_groups", column: "group_id" },
    places: { table: "event_places", column: "place_id" },
    organizations: { table: "event_organizations", column: "organization_id" },
    sources: { table: "event_sources", column: "source_id" },
    media: { table: "event_media", column: "media_id" },
    online_resources: {
      table: "event_online_resources",
      column: "online_resource_id",
    },
  };
  const config = supported[type];
  if (!config) {
    return res.status(400).json({ error: "Unsupported link type" });
  }
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: "ids must be a non-empty array" });
  }
  const values = [];
  const placeholders = ids
    .map((id, idx) => {
      values.push(req.params.id, id);
      const offset = idx * 2;
      return `($${offset + 1}, $${offset + 2})`;
    })
    .join(", ");
  await db.query(
    `INSERT INTO ${config.table} (event_id, ${config.column})
     VALUES ${placeholders}
     ON CONFLICT DO NOTHING`,
    values
  );
  res.status(201).json({ ok: true });
});

app.get("/api/events/:id/links", async (req, res) => {
  const eventId = req.params.id;
  const [people, groups, places] = await Promise.all([
    db.query(
      `SELECT p.* FROM people p
       JOIN event_people ep ON ep.person_id = p.id
       WHERE ep.event_id = $1`,
      [eventId]
    ),
    db.query(
      `SELECT g.* FROM groups g
       JOIN event_groups eg ON eg.group_id = g.id
       WHERE eg.event_id = $1`,
      [eventId]
    ),
    db.query(
      `SELECT pl.* FROM places pl
       JOIN event_places ep ON ep.place_id = pl.id
       WHERE ep.event_id = $1`,
      [eventId]
    ),
  ]);
  res.json({
    people: people.rows,
    groups: groups.rows,
    places: places.rows,
  });
});

module.exports = app;
