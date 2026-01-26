const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const db = require("../src/db");

const rootDir = path.resolve(__dirname, "..", "..", "..");
const eventiDir = path.join(rootDir, "Eventi");
const eventiNoIdDir = path.join(rootDir, "Eventi-NO_ID");

const readCsv = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  if (!content.trim()) return [];
  return parse(content, {
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
  });
};

const normalize = (value) => (value || "").trim().toLowerCase();

const getEventIdMap = async () => {
  const result = await db.query("SELECT id, source_record_id FROM events");
  return new Map(
    result.rows.map((row) => [row.source_record_id, row.id])
  );
};

const getEntityIdMap = async (table) => {
  const result = await db.query(
    `SELECT id, source_record_id FROM ${table} WHERE source_record_id IS NOT NULL`
  );
  return new Map(
    result.rows.map((row) => [row.source_record_id, row.id])
  );
};

const upsertEvent = async (row) => {
  const result = await db.query(
    `INSERT INTO events
      (source_record_id, title, event_date, description, type, genre, series, tags, place_text, slug, status, notes)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (source_record_id) DO UPDATE SET
      title = EXCLUDED.title,
      event_date = EXCLUDED.event_date,
      description = EXCLUDED.description,
      type = EXCLUDED.type,
      genre = EXCLUDED.genre,
      series = EXCLUDED.series,
      tags = EXCLUDED.tags,
      place_text = EXCLUDED.place_text,
      slug = EXCLUDED.slug,
      status = EXCLUDED.status,
      notes = EXCLUDED.notes,
      updated_at = now()
     RETURNING id`,
    [
      row.form_record_id || null,
      row["Titolo"] || null,
      row["Data"] || null,
      row["Descrizione"] || null,
      row["Tipo"] || null,
      row["Genere"] || null,
      row["Evento-Rassegna"] || null,
      row["Tag"]
        ? row["Tag"].split(",").map((tag) => tag.trim())
        : null,
      row["Luogo"] || null,
      row["Slug"] || null,
      row["Stato record"] || null,
      row["NOTE"] || null,
    ]
  );
  return result.rows[0]?.id;
};

const upsertPerson = async (row) => {
  const result = await db.query(
    `INSERT INTO people
      (source_record_id, full_name, last_name, first_name, aka, role, bio, slug, status)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (source_record_id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      last_name = EXCLUDED.last_name,
      first_name = EXCLUDED.first_name,
      aka = EXCLUDED.aka,
      role = EXCLUDED.role,
      bio = EXCLUDED.bio,
      slug = EXCLUDED.slug,
      status = EXCLUDED.status,
      updated_at = now()
     RETURNING id`,
    [
      row.form_record_id || null,
      row["Nome completo"] || null,
      row["Cognome"] || null,
      row["Nome"] || null,
      row["Aka"] || null,
      row["Ruolo"] || null,
      row["Bio"] || null,
      row["Slug"] || null,
      row["Stato record"] || null,
    ]
  );
  return result.rows[0]?.id;
};

const upsertGroup = async (row) => {
  const result = await db.query(
    `INSERT INTO groups
      (source_record_id, name, type, active_from, active_to, bio, status)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (source_record_id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      active_from = EXCLUDED.active_from,
      active_to = EXCLUDED.active_to,
      bio = EXCLUDED.bio,
      status = EXCLUDED.status,
      updated_at = now()
     RETURNING id`,
    [
      row.form_record_id || null,
      row["Nome"] || null,
      row["Tipo"] || null,
      row["Attivo dal..."] || null,
      row["fino al..."] || null,
      row["Biografia"] || null,
      row["Stato record"] || null,
    ]
  );
  return result.rows[0]?.id;
};

const upsertPlace = async (row) => {
  const result = await db.query(
    `INSERT INTO places
      (source_record_id, name, city, address, type, active_from, active_to, slug, status)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (source_record_id) DO UPDATE SET
      name = EXCLUDED.name,
      city = EXCLUDED.city,
      address = EXCLUDED.address,
      type = EXCLUDED.type,
      active_from = EXCLUDED.active_from,
      active_to = EXCLUDED.active_to,
      slug = EXCLUDED.slug,
      status = EXCLUDED.status,
      updated_at = now()
     RETURNING id`,
    [
      row.form_record_id || null,
      row["Nome"] || null,
      row["Città"] || null,
      row["Indirizzo"] || null,
      row["Tipo"] || null,
      row["Attivo dal"] || null,
      row["...fino al"] || null,
      row["Slug"] || null,
      row["Stato record"] || null,
    ]
  );
  return result.rows[0]?.id;
};

const upsertOrganization = async (row) => {
  const result = await db.query(
    `INSERT INTO organizations
      (source_record_id, name, type, slug, status)
     VALUES
      ($1,$2,$3,$4,$5)
     ON CONFLICT (source_record_id) DO UPDATE SET
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      slug = EXCLUDED.slug,
      status = EXCLUDED.status,
      updated_at = now()
     RETURNING id`,
    [
      row.form_record_id || null,
      row["Nome"] || null,
      row["Tipo"] || null,
      row["Slug"] || null,
      row["Stato record"] || null,
    ]
  );
  return result.rows[0]?.id;
};

const upsertSource = async (row) => {
  const result = await db.query(
    `INSERT INTO sources
      (source_record_id, type, title, status)
     VALUES
      ($1,$2,$3,$4)
     ON CONFLICT (source_record_id) DO UPDATE SET
      type = EXCLUDED.type,
      title = EXCLUDED.title,
      status = EXCLUDED.status,
      updated_at = now()
     RETURNING id`,
    [
      row.form_record_id || null,
      row["Tipo"] || null,
      row["Titolo"] || null,
      row["Stato record"] || null,
    ]
  );
  return result.rows[0]?.id;
};

const upsertMedia = async (row) => {
  const result = await db.query(
    `INSERT INTO media
      (source_record_id, type, title, slug)
     VALUES
      ($1,$2,$3,$4)
     ON CONFLICT (source_record_id) DO UPDATE SET
      type = EXCLUDED.type,
      title = EXCLUDED.title,
      slug = EXCLUDED.slug,
      updated_at = now()
     RETURNING id`,
    [
      row.form_record_id || null,
      row["Tipo"] || null,
      row["Titolo"] || null,
      row["Slug"] || null,
    ]
  );
  return result.rows[0]?.id;
};

const upsertOnlineResource = async (row) => {
  const result = await db.query(
    `INSERT INTO online_resources
      (source_record_id, type, title, url, status)
     VALUES
      ($1,$2,$3,$4,$5)
     ON CONFLICT (source_record_id) DO UPDATE SET
      type = EXCLUDED.type,
      title = EXCLUDED.title,
      url = EXCLUDED.url,
      status = EXCLUDED.status,
      updated_at = now()
     RETURNING id`,
    [
      row.form_record_id || null,
      row["Tipo"] || null,
      row["Titolo"] || null,
      row["URL"] || null,
      row["Stato record"] || null,
    ]
  );
  return result.rows[0]?.id;
};

const linkEventToEntity = async (eventId, entityId, table, column) => {
  if (!eventId || !entityId) return;
  await db.query(
    `INSERT INTO ${table} (event_id, ${column})
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [eventId, entityId]
  );
};

const seedWithoutIds = async () => {
  const people = readCsv(path.join(eventiNoIdDir, "Personaggi.csv"));
  for (const row of people) {
    const fullName = row["Nome completo"] || row["Nome"] || row["Cognome"];
    if (!fullName) continue;
    const existing = await db.query(
      "SELECT id FROM people WHERE lower(full_name) = $1",
      [normalize(fullName)]
    );
    if (existing.rowCount) continue;
    await db.query(
      `INSERT INTO people
        (full_name, last_name, first_name, aka, role, bio, slug, status)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        fullName,
        row["Cognome"] || null,
        row["Nome"] || null,
        row["Aka"] || null,
        row["Ruolo"] || null,
        row["Bio"] || null,
        row["Slug"] || null,
        row["Stato record"] || null,
      ]
    );
  }

  const groups = readCsv(path.join(eventiNoIdDir, "Gruppi.csv"));
  for (const row of groups) {
    if (!row["Nome"]) continue;
    const existing = await db.query(
      "SELECT id FROM groups WHERE lower(name) = $1",
      [normalize(row["Nome"])]
    );
    if (existing.rowCount) continue;
    await db.query(
      `INSERT INTO groups (name, type, active_from, active_to, bio, status)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        row["Nome"],
        row["Tipo"] || null,
        row["Attivo dal..."] || null,
        row["fino al..."] || null,
        row["Biografia"] || null,
        row["Stato record"] || null,
      ]
    );
  }

  const places = readCsv(path.join(eventiNoIdDir, "Sedi-Luoghi.csv"));
  for (const row of places) {
    const name = row["Nome"] || row["Città"];
    if (!name) continue;
    const existing = await db.query(
      "SELECT id FROM places WHERE lower(name) = $1 AND city IS NOT DISTINCT FROM $2",
      [normalize(name), row["Città"] || null]
    );
    if (existing.rowCount) continue;
    await db.query(
      `INSERT INTO places
        (name, city, address, type, active_from, active_to, slug, status)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        row["Nome"] || null,
        row["Città"] || null,
        row["Indirizzo"] || null,
        row["Tipo"] || null,
        row["Attivo dal"] || null,
        row["...fino al"] || null,
        row["Slug"] || null,
        row["Stato record"] || null,
      ]
    );
  }

  const events = readCsv(path.join(eventiNoIdDir, "Eventi-no_ID.csv"));
  for (const row of events) {
    if (!row["Titolo"]) continue;
    const existing = await db.query(
      "SELECT id FROM events WHERE lower(title) = $1 AND event_date IS NOT DISTINCT FROM $2",
      [normalize(row["Titolo"]), row["Data"] || null]
    );
    if (existing.rowCount) continue;
    await db.query(
      `INSERT INTO events
        (title, event_date, description, type, genre, series, tags, place_text, slug, status, notes)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        row["Titolo"],
        row["Data"] || null,
        row["Descrizione"] || null,
        row["Tipo"] || null,
        row["Genere"] || null,
        row["Evento-Rassegna"] || null,
        row["Tag"]
          ? row["Tag"].split(",").map((tag) => tag.trim())
          : null,
        row["Luogo"] || null,
        row["Slug"] || null,
        row["Stato record"] || null,
        row["NOTE"] || null,
      ]
    );
  }
};

const run = async () => {
  const events = readCsv(path.join(eventiDir, "Eventi.csv"));
  for (const row of events) {
    await upsertEvent(row);
  }

  const eventIdMap = await getEventIdMap();

  const peopleLinks = readCsv(path.join(eventiDir, "LinkTo-Personaggi.csv"));
  for (const row of peopleLinks) {
    const personId = await upsertPerson(row);
    const eventId = eventIdMap.get(row.parent_record_id);
    await linkEventToEntity(eventId, personId, "event_people", "person_id");
  }

  const groupLinks = readCsv(path.join(eventiDir, "LinkTo-Gruppi.csv"));
  for (const row of groupLinks) {
    const groupId = await upsertGroup(row);
    const eventId = eventIdMap.get(row.parent_record_id);
    await linkEventToEntity(eventId, groupId, "event_groups", "group_id");
  }

  const placeLinks = readCsv(path.join(eventiDir, "LinkTo-Sedi-Luoghi.csv"));
  for (const row of placeLinks) {
    const placeId = await upsertPlace(row);
    const eventId = eventIdMap.get(row.parent_record_id);
    await linkEventToEntity(eventId, placeId, "event_places", "place_id");
  }

  const organizationLinks = readCsv(
    path.join(eventiDir, "LinkTo-Organizzazioni.csv")
  );
  for (const row of organizationLinks) {
    const orgId = await upsertOrganization(row);
    const eventId = eventIdMap.get(row.parent_record_id);
    await linkEventToEntity(
      eventId,
      orgId,
      "event_organizations",
      "organization_id"
    );
  }

  const sourceLinks = readCsv(path.join(eventiDir, "LinkTo-Fonti.csv"));
  for (const row of sourceLinks) {
    const sourceId = await upsertSource(row);
    const eventId = eventIdMap.get(row.parent_record_id);
    await linkEventToEntity(eventId, sourceId, "event_sources", "source_id");
  }

  const mediaLinks = readCsv(path.join(eventiDir, "LinkTo-Media.csv"));
  for (const row of mediaLinks) {
    const mediaId = await upsertMedia(row);
    const eventId = eventIdMap.get(row.parent_record_id);
    await linkEventToEntity(eventId, mediaId, "event_media", "media_id");
  }

  const onlineLinks = readCsv(path.join(eventiDir, "LinkTo-Risorse online.csv"));
  for (const row of onlineLinks) {
    const resourceId = await upsertOnlineResource(row);
    const eventId = eventIdMap.get(row.parent_record_id);
    await linkEventToEntity(
      eventId,
      resourceId,
      "event_online_resources",
      "online_resource_id"
    );
  }

  await seedWithoutIds();
};

run()
  .then(() => {
    console.log("CSV import completed.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("CSV import failed:", error);
    process.exit(1);
  });
