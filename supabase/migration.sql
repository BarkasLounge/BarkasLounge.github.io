CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE menu_items (
    id text PRIMARY KEY,
    venue text NOT NULL CHECK (venue IN ('khleb', 'veranda', 'both')),
    category text NOT NULL CHECK (category IN ('hookah', 'pizza', 'tea', 'coffee')),
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    price integer,
    price_s integer,
    price_m integer,
    price_l integer,
    weight_g integer,
    kcal numeric,
    protein numeric,
    fat numeric,
    carb numeric,
    photo_path text,
    badge text,
    sort integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE promos (
    id text PRIMARY KEY,
    venue text CHECK (venue IN ('khleb', 'veranda', 'both')),
    tag text,
    title text NOT NULL,
    description text,
    value_text text,
    rules text,
    sort integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE gallery_photos (
    id text PRIMARY KEY,
    venue text NOT NULL CHECK (venue IN ('khleb', 'veranda')),
    path text NOT NULL,
    alt text NOT NULL DEFAULT '',
    sort integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE settings (
    key text PRIMARY KEY,
    value text NOT NULL
);

CREATE TABLE bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    venue text NOT NULL CHECK (venue IN ('khleb', 'veranda')),
    name text NOT NULL,
    phone text NOT NULL,
    date date NOT NULL,
    time text NOT NULL,
    guests integer NOT NULL CHECK (guests BETWEEN 1 AND 12),
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'cancelled')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE change_log (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor text,
    entity text,
    entity_id text,
    diff jsonb,
    at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_owner() RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_staff() RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.my_role() RETURNS text AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_trigger
BEFORE UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY menu_public_read ON menu_items FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY promos_public_read ON promos FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY gallery_public_read ON gallery_photos FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY menu_admin_all ON menu_items FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY promos_admin_all ON promos FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());
CREATE POLICY gallery_admin_all ON gallery_photos FOR ALL TO authenticated USING (is_staff()) WITH CHECK (is_staff());

CREATE POLICY bookings_insert ON bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY bookings_staff_read ON bookings FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY bookings_staff_update ON bookings FOR UPDATE TO authenticated USING (is_staff());

CREATE POLICY change_log_staff_insert ON change_log FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY change_log_owner_read ON change_log FOR SELECT TO authenticated USING (is_owner());

CREATE POLICY profiles_self_select ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY profiles_self_insert ON profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid() AND role = 'editor');
CREATE POLICY profiles_self_update ON profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = public.my_role());

CREATE POLICY settings_owner_all ON settings FOR ALL TO authenticated USING (is_owner()) WITH CHECK (is_owner());

INSERT INTO settings (key, value) VALUES ('promo_rules', 'Акции не суммируются между собой и с другими скидками. Одна акция — один стол/чек.');

INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY media_admin_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');
CREATE POLICY media_admin_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media');
CREATE POLICY media_admin_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media');
