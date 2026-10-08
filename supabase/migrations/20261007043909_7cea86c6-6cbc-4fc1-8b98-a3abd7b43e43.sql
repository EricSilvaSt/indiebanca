DO $$ BEGIN
  CREATE TYPE indiebanca.band_member_role AS ENUM ('owner', 'admin', 'editor', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE indiebanca.membership_status AS ENUM ('pending', 'active', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE indiebanca.album_type AS ENUM ('Álbum', 'EP', 'Single', 'Ao vivo', 'Coletânea');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE indiebanca.claim_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE indiebanca.tip_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE indiebanca.bands
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS support_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE indiebanca.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id uuid NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  title text NOT NULL,
  type indiebanca.album_type NOT NULL DEFAULT 'Álbum',
  cover_url text,
  release_year integer NOT NULL DEFAULT extract(year from now())::integer,
  release_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (band_id, title, release_year)
);
GRANT SELECT ON indiebanca.albums TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON indiebanca.albums TO authenticated;
GRANT ALL ON indiebanca.albums TO service_role;
ALTER TABLE indiebanca.albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Albums are viewable by everyone" ON indiebanca.albums FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Band managers create albums" ON indiebanca.albums FOR INSERT TO authenticated WITH CHECK (indiebanca.is_band_owner(band_id));
CREATE POLICY "Band managers update albums" ON indiebanca.albums FOR UPDATE TO authenticated USING (indiebanca.is_band_owner(band_id)) WITH CHECK (indiebanca.is_band_owner(band_id));
CREATE POLICY "Band managers delete albums" ON indiebanca.albums FOR DELETE TO authenticated USING (indiebanca.is_band_owner(band_id));

ALTER TABLE indiebanca.songs
  ADD COLUMN IF NOT EXISTS album_id uuid REFERENCES indiebanca.albums(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS track_number integer;

CREATE TABLE indiebanca.band_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id uuid NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role indiebanca.band_member_role NOT NULL DEFAULT 'member',
  status indiebanca.membership_status NOT NULL DEFAULT 'active',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (band_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON indiebanca.band_members TO authenticated;
GRANT ALL ON indiebanca.band_members TO service_role;
ALTER TABLE indiebanca.band_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION indiebanca.is_band_member(_band_id uuid, _roles indiebanca.band_member_role[] DEFAULT ARRAY['owner','admin','editor','member']::indiebanca.band_member_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = indiebanca
AS $$
  SELECT EXISTS (
    SELECT 1 FROM indiebanca.bands b WHERE b.id = _band_id AND b.owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM indiebanca.band_members bm
    WHERE bm.band_id = _band_id AND bm.user_id = auth.uid() AND bm.status = 'active' AND bm.role = ANY(_roles)
  );
$$;
REVOKE ALL ON FUNCTION indiebanca.is_band_member(uuid, indiebanca.band_member_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION indiebanca.is_band_member(uuid, indiebanca.band_member_role[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION indiebanca.is_band_owner(_band_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = indiebanca
AS $$
  SELECT indiebanca.is_band_member(_band_id, ARRAY['owner','admin','editor']::indiebanca.band_member_role[]);
$$;
REVOKE ALL ON FUNCTION indiebanca.is_band_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION indiebanca.is_band_owner(uuid) TO authenticated, service_role;

CREATE POLICY "Members view their memberships" ON indiebanca.band_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[]));
CREATE POLICY "Band admins add members" ON indiebanca.band_members FOR INSERT TO authenticated
WITH CHECK (indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[]));
CREATE POLICY "Band admins update members" ON indiebanca.band_members FOR UPDATE TO authenticated
USING (indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[]))
WITH CHECK (indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[]));
CREATE POLICY "Band admins remove members" ON indiebanca.band_members FOR DELETE TO authenticated
USING (indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[]));

INSERT INTO indiebanca.band_members (band_id, user_id, role, status, invited_by)
SELECT id, owner_user_id, 'owner', 'active', owner_user_id FROM indiebanca.bands WHERE owner_user_id IS NOT NULL
ON CONFLICT (band_id, user_id) DO UPDATE SET role = 'owner', status = 'active';

CREATE TABLE indiebanca.band_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id uuid NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  email text NOT NULL,
  role indiebanca.band_member_role NOT NULL DEFAULT 'member',
  status indiebanca.membership_status NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON indiebanca.band_invitations TO authenticated;
GRANT ALL ON indiebanca.band_invitations TO service_role;
ALTER TABLE indiebanca.band_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Band admins view invitations" ON indiebanca.band_invitations FOR SELECT TO authenticated USING (indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[]));
CREATE POLICY "Band admins create invitations" ON indiebanca.band_invitations FOR INSERT TO authenticated WITH CHECK (invited_by = auth.uid() AND indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[]));
CREATE POLICY "Band admins update invitations" ON indiebanca.band_invitations FOR UPDATE TO authenticated USING (indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[])) WITH CHECK (indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[]));
CREATE POLICY "Band admins delete invitations" ON indiebanca.band_invitations FOR DELETE TO authenticated USING (indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[]));

CREATE TABLE indiebanca.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  band_id uuid REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON indiebanca.notifications TO authenticated;
GRANT ALL ON indiebanca.notifications TO service_role;
ALTER TABLE indiebanca.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON indiebanca.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users mark own notifications" ON indiebanca.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove own notifications" ON indiebanca.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION indiebanca.notify_band_followers()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = indiebanca
AS $$
DECLARE band_name text; item_title text; item_type text;
BEGIN
  SELECT name INTO band_name FROM indiebanca.bands WHERE id = NEW.band_id;
  IF TG_TABLE_NAME = 'songs' THEN item_title := NEW.title; item_type := 'music';
  ELSIF TG_TABLE_NAME = 'products' THEN item_title := NEW.name; item_type := 'product';
  ELSIF TG_TABLE_NAME = 'events' THEN item_title := NEW.title; item_type := 'event';
  ELSE item_title := left(NEW.content, 80); item_type := 'post'; END IF;
  INSERT INTO indiebanca.notifications (user_id, band_id, type, title, message, link)
  SELECT f.user_id, NEW.band_id, item_type, band_name || ' publicou uma novidade', item_title, '/banda/' || b.slug
  FROM indiebanca.followers f JOIN indiebanca.bands b ON b.id = NEW.band_id WHERE f.band_id = NEW.band_id;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION indiebanca.notify_band_followers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION indiebanca.notify_band_followers() TO service_role;
CREATE TRIGGER notify_followers_song AFTER INSERT ON indiebanca.songs FOR EACH ROW EXECUTE FUNCTION indiebanca.notify_band_followers();
CREATE TRIGGER notify_followers_product AFTER INSERT ON indiebanca.products FOR EACH ROW EXECUTE FUNCTION indiebanca.notify_band_followers();
CREATE TRIGGER notify_followers_event AFTER INSERT ON indiebanca.events FOR EACH ROW EXECUTE FUNCTION indiebanca.notify_band_followers();
CREATE TRIGGER notify_followers_post AFTER INSERT ON indiebanca.posts FOR EACH ROW EXECUTE FUNCTION indiebanca.notify_band_followers();

CREATE TABLE indiebanca.tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id uuid NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  supporter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  supporter_name text NOT NULL,
  supporter_email text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 1),
  message text NOT NULL DEFAULT '',
  status indiebanca.tip_status NOT NULL DEFAULT 'pending',
  provider_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON indiebanca.tips TO authenticated;
GRANT UPDATE ON indiebanca.tips TO service_role;
GRANT ALL ON indiebanca.tips TO service_role;
ALTER TABLE indiebanca.tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Supporters create own tips" ON indiebanca.tips FOR INSERT TO authenticated WITH CHECK (supporter_user_id = auth.uid() AND EXISTS (SELECT 1 FROM indiebanca.bands b WHERE b.id = band_id AND b.verified AND b.support_enabled));
CREATE POLICY "Supporters view own tips" ON indiebanca.tips FOR SELECT TO authenticated USING (supporter_user_id = auth.uid());
CREATE POLICY "Band managers view received tips" ON indiebanca.tips FOR SELECT TO authenticated USING (indiebanca.is_band_member(band_id, ARRAY['owner','admin']::indiebanca.band_member_role[]));

CREATE TABLE indiebanca.band_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id uuid NOT NULL REFERENCES indiebanca.bands(id) ON DELETE CASCADE,
  claimant_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimed_role text NOT NULL,
  official_url text NOT NULL,
  evidence text NOT NULL,
  status indiebanca.claim_status NOT NULL DEFAULT 'pending',
  reviewer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (band_id, claimant_user_id)
);
GRANT SELECT, INSERT, UPDATE ON indiebanca.band_claims TO authenticated;
GRANT ALL ON indiebanca.band_claims TO service_role;
ALTER TABLE indiebanca.band_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users submit claims" ON indiebanca.band_claims FOR INSERT TO authenticated WITH CHECK (claimant_user_id = auth.uid());
CREATE POLICY "Users view own claims" ON indiebanca.band_claims FOR SELECT TO authenticated USING (claimant_user_id = auth.uid());
CREATE POLICY "Admins view all claims" ON indiebanca.band_claims FOR SELECT TO authenticated USING (indiebanca.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins review claims" ON indiebanca.band_claims FOR UPDATE TO authenticated USING (indiebanca.has_role(auth.uid(), 'admin')) WITH CHECK (indiebanca.has_role(auth.uid(), 'admin') AND reviewer_user_id = auth.uid());

CREATE OR REPLACE FUNCTION indiebanca.approve_band_claim(_claim_id uuid, _notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = indiebanca
AS $$
DECLARE c indiebanca.band_claims;
BEGIN
  IF NOT indiebanca.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO c FROM indiebanca.band_claims WHERE id = _claim_id AND status = 'pending' FOR UPDATE;
  IF c.id IS NULL THEN RAISE EXCEPTION 'Claim not found'; END IF;
  UPDATE indiebanca.band_claims SET status = 'approved', reviewer_user_id = auth.uid(), review_notes = _notes, reviewed_at = now(), updated_at = now() WHERE id = _claim_id;
  UPDATE indiebanca.bands SET owner_user_id = c.claimant_user_id, verified = true, verified_at = now() WHERE id = c.band_id;
  INSERT INTO indiebanca.band_members (band_id, user_id, role, status, invited_by) VALUES (c.band_id, c.claimant_user_id, 'owner', 'active', auth.uid()) ON CONFLICT (band_id, user_id) DO UPDATE SET role = 'owner', status = 'active';
END; $$;
REVOKE ALL ON FUNCTION indiebanca.approve_band_claim(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION indiebanca.approve_band_claim(uuid, text) TO authenticated, service_role;

CREATE TRIGGER trg_albums_updated BEFORE UPDATE ON indiebanca.albums FOR EACH ROW EXECUTE FUNCTION indiebanca.set_updated_at();
CREATE TRIGGER trg_members_updated BEFORE UPDATE ON indiebanca.band_members FOR EACH ROW EXECUTE FUNCTION indiebanca.set_updated_at();
CREATE TRIGGER trg_invitations_updated BEFORE UPDATE ON indiebanca.band_invitations FOR EACH ROW EXECUTE FUNCTION indiebanca.set_updated_at();
CREATE TRIGGER trg_tips_updated BEFORE UPDATE ON indiebanca.tips FOR EACH ROW EXECUTE FUNCTION indiebanca.set_updated_at();
CREATE TRIGGER trg_claims_updated BEFORE UPDATE ON indiebanca.band_claims FOR EACH ROW EXECUTE FUNCTION indiebanca.set_updated_at();