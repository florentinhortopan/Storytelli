CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id text UNIQUE,
  title text NOT NULL,
  event_date date,
  description text,
  type text,
  genre text,
  series text,
  tags text[],
  place_text text,
  slug text,
  status text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT events_status_check
    CHECK (status IS NULL OR status IN ('draft', 'review', 'published'))
);

CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id text UNIQUE,
  full_name text NOT NULL,
  last_name text,
  first_name text,
  aka text,
  role text,
  bio text,
  slug text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT people_status_check
    CHECK (status IS NULL OR status IN ('draft', 'review', 'published'))
);

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id text UNIQUE,
  name text NOT NULL,
  type text,
  active_from date,
  active_to date,
  bio text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT groups_status_check
    CHECK (status IS NULL OR status IN ('draft', 'review', 'published'))
);

CREATE TABLE IF NOT EXISTS places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id text UNIQUE,
  name text,
  city text,
  address text,
  type text,
  active_from date,
  active_to date,
  slug text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT places_status_check
    CHECK (status IS NULL OR status IN ('draft', 'review', 'published'))
);

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id text UNIQUE,
  name text NOT NULL,
  type text,
  slug text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id text UNIQUE,
  type text,
  title text NOT NULL,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id text UNIQUE,
  type text,
  title text NOT NULL,
  slug text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS online_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_record_id text UNIQUE,
  type text,
  title text NOT NULL,
  url text,
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_people (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, person_id)
);

CREATE TABLE IF NOT EXISTS event_groups (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, group_id)
);

CREATE TABLE IF NOT EXISTS event_places (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  place_id uuid REFERENCES places(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, place_id)
);

CREATE TABLE IF NOT EXISTS event_organizations (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, organization_id)
);

CREATE TABLE IF NOT EXISTS event_sources (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  source_id uuid REFERENCES sources(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, source_id)
);

CREATE TABLE IF NOT EXISTS event_media (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  media_id uuid REFERENCES media(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, media_id)
);

CREATE TABLE IF NOT EXISTS event_online_resources (
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  online_resource_id uuid REFERENCES online_resources(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, online_resource_id)
);

CREATE TABLE IF NOT EXISTS person_groups (
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  PRIMARY KEY (person_id, group_id)
);
