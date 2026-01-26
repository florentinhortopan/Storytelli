DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_status_check'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_status_check
      CHECK (status IS NULL OR status IN ('draft', 'review', 'published'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'people_status_check'
  ) THEN
    ALTER TABLE people
      ADD CONSTRAINT people_status_check
      CHECK (status IS NULL OR status IN ('draft', 'review', 'published'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'groups_status_check'
  ) THEN
    ALTER TABLE groups
      ADD CONSTRAINT groups_status_check
      CHECK (status IS NULL OR status IN ('draft', 'review', 'published'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'places_status_check'
  ) THEN
    ALTER TABLE places
      ADD CONSTRAINT places_status_check
      CHECK (status IS NULL OR status IN ('draft', 'review', 'published'));
  END IF;
END
$$;
