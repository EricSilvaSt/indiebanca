CREATE SCHEMA IF NOT EXISTS indiebanca;
GRANT USAGE ON SCHEMA indiebanca TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION indiebanca.guard_band_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = indiebanca
AS $$
BEGIN
  IF auth.role() = 'service_role' OR indiebanca.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF OLD.owner_user_id IS DISTINCT FROM NEW.owner_user_id THEN
    RAISE EXCEPTION 'Only a platform administrator can transfer band ownership';
  END IF;

  IF OLD.verified IS DISTINCT FROM NEW.verified OR OLD.verified_at IS DISTINCT FROM NEW.verified_at THEN
    RAISE EXCEPTION 'Only a platform administrator can change verification status';
  END IF;

  IF OLD.featured IS DISTINCT FROM NEW.featured OR OLD.monthly_listeners IS DISTINCT FROM NEW.monthly_listeners THEN
    RAISE EXCEPTION 'Only a platform administrator can change platform metrics';
  END IF;

  IF OLD.support_enabled IS DISTINCT FROM NEW.support_enabled THEN
    IF NOT indiebanca.is_band_member(OLD.id, ARRAY['owner', 'admin']::indiebanca.band_member_role[]) THEN
      RAISE EXCEPTION 'Only band owners and administrators can change support settings';
    END IF;
    IF NEW.support_enabled AND NOT NEW.verified THEN
      RAISE EXCEPTION 'Only verified bands can enable support';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION indiebanca.guard_band_sensitive_fields() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_band_sensitive_fields ON indiebanca.bands;
CREATE TRIGGER trg_guard_band_sensitive_fields
  BEFORE UPDATE ON indiebanca.bands
  FOR EACH ROW EXECUTE FUNCTION indiebanca.guard_band_sensitive_fields();

CREATE OR REPLACE FUNCTION indiebanca.guard_band_member_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = indiebanca
AS $$
BEGIN
  IF auth.role() = 'service_role' OR indiebanca.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'owner' THEN
      IF NEW.user_id = auth.uid() AND EXISTS (
        SELECT 1 FROM indiebanca.bands b
        WHERE b.id = NEW.band_id AND b.owner_user_id = NEW.user_id
      ) THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Only a platform administrator can assign the owner role';
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.role <> 'owner' AND NEW.role = 'owner' THEN
    RAISE EXCEPTION 'Only a platform administrator can assign the owner role';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role <> 'owner' THEN
    RAISE EXCEPTION 'Only a platform administrator can remove the owner role';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION indiebanca.guard_band_member_roles() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_band_member_roles ON indiebanca.band_members;
CREATE TRIGGER trg_guard_band_member_roles
  BEFORE INSERT OR UPDATE OF role ON indiebanca.band_members
  FOR EACH ROW EXECUTE FUNCTION indiebanca.guard_band_member_roles();

CREATE OR REPLACE FUNCTION indiebanca.add_band_owner_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = indiebanca
AS $$
BEGIN
  IF NEW.owner_user_id IS NOT NULL THEN
    INSERT INTO indiebanca.band_members (band_id, user_id, role, status, invited_by)
    VALUES (NEW.id, NEW.owner_user_id, 'owner', 'active', NEW.owner_user_id)
    ON CONFLICT (band_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION indiebanca.add_band_owner_membership() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_add_band_owner_membership ON indiebanca.bands;
CREATE TRIGGER trg_add_band_owner_membership
  AFTER INSERT ON indiebanca.bands
  FOR EACH ROW EXECUTE FUNCTION indiebanca.add_band_owner_membership();

REVOKE INSERT ON indiebanca.band_members FROM authenticated;

CREATE OR REPLACE FUNCTION indiebanca.guard_band_invitation_roles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = indiebanca
AS $$
BEGIN
  IF NEW.role = 'owner' THEN
    RAISE EXCEPTION 'Band ownership cannot be assigned through an invitation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION indiebanca.guard_band_invitation_roles() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_guard_band_invitation_roles ON indiebanca.band_invitations;
CREATE TRIGGER trg_guard_band_invitation_roles
  BEFORE INSERT OR UPDATE OF role ON indiebanca.band_invitations
  FOR EACH ROW EXECUTE FUNCTION indiebanca.guard_band_invitation_roles();

CREATE OR REPLACE FUNCTION indiebanca.notify_band_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = indiebanca
AS $$
DECLARE
  invitee_user_id uuid;
  band_name text;
BEGIN
  SELECT id INTO invitee_user_id
  FROM auth.users
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF invitee_user_id IS NOT NULL THEN
    SELECT name INTO band_name FROM indiebanca.bands WHERE id = NEW.band_id;
    INSERT INTO indiebanca.notifications (user_id, band_id, type, title, message, link)
    VALUES (
      invitee_user_id,
      NEW.band_id,
      'band_invitation',
      'Convite para integrar uma banda',
      coalesce(band_name, 'Uma banda') || ' convidou você como ' || NEW.role::text || '.',
      '/dashboard'
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION indiebanca.notify_band_invitation() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_notify_band_invitation ON indiebanca.band_invitations;
CREATE TRIGGER trg_notify_band_invitation
  AFTER INSERT ON indiebanca.band_invitations
  FOR EACH ROW EXECUTE FUNCTION indiebanca.notify_band_invitation();

DROP POLICY IF EXISTS "Band owners and admins update band profile" ON indiebanca.bands;
CREATE POLICY "Band owners and admins update band profile"
  ON indiebanca.bands FOR UPDATE TO authenticated
  USING (indiebanca.is_band_member(id, ARRAY['owner', 'admin']::indiebanca.band_member_role[]))
  WITH CHECK (indiebanca.is_band_member(id, ARRAY['owner', 'admin']::indiebanca.band_member_role[]));

DROP POLICY IF EXISTS "Band owners view items of their band" ON indiebanca.order_items;
DROP POLICY IF EXISTS "Band managers view items of their band" ON indiebanca.order_items;
CREATE POLICY "Band managers view items of their band"
  ON indiebanca.order_items FOR SELECT TO authenticated
  USING (indiebanca.is_band_member(band_id, ARRAY['owner', 'admin']::indiebanca.band_member_role[]));

CREATE OR REPLACE FUNCTION indiebanca.band_manager_has_item_in_order(_order_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = indiebanca
AS $$
  SELECT EXISTS (
    SELECT 1 FROM indiebanca.order_items oi
    WHERE oi.order_id = _order_id
      AND indiebanca.is_band_member(oi.band_id, ARRAY['owner', 'admin']::indiebanca.band_member_role[])
  );
$$;

REVOKE ALL ON FUNCTION indiebanca.band_manager_has_item_in_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION indiebanca.band_manager_has_item_in_order(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Band owners view orders containing their items" ON indiebanca.orders;
DROP POLICY IF EXISTS "Band managers view orders containing their items" ON indiebanca.orders;
CREATE POLICY "Band managers view orders containing their items"
  ON indiebanca.orders FOR SELECT TO authenticated
  USING (indiebanca.band_manager_has_item_in_order(id));

DROP POLICY IF EXISTS "Band owners update orders containing their items" ON indiebanca.orders;
DROP POLICY IF EXISTS "Band managers update orders containing their items" ON indiebanca.orders;
CREATE POLICY "Band managers update orders containing their items"
  ON indiebanca.orders FOR UPDATE TO authenticated
  USING (indiebanca.band_manager_has_item_in_order(id))
  WITH CHECK (indiebanca.band_manager_has_item_in_order(id));

DROP POLICY IF EXISTS "Users view invitations addressed to them" ON indiebanca.band_invitations;
CREATE POLICY "Users view invitations addressed to them"
  ON indiebanca.band_invitations FOR SELECT TO authenticated
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND status = 'pending'
    AND expires_at > now()
  );

CREATE OR REPLACE FUNCTION indiebanca.accept_band_invitation(_invitation_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = indiebanca
AS $$
DECLARE invitation indiebanca.band_invitations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO invitation
  FROM indiebanca.band_invitations
  WHERE id = _invitation_id
  FOR UPDATE;

  IF invitation.id IS NULL
    OR invitation.status <> 'pending'
    OR invitation.expires_at <= now()
    OR lower(invitation.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) THEN
    RAISE EXCEPTION 'Invitation is invalid, expired, or addressed to another account';
  END IF;

  INSERT INTO indiebanca.band_members AS existing_member (band_id, user_id, role, status, invited_by)
  VALUES (invitation.band_id, auth.uid(), invitation.role, 'active', invitation.invited_by)
  ON CONFLICT (band_id, user_id) DO UPDATE
    SET role = CASE
          WHEN existing_member.status = 'active' THEN existing_member.role
          ELSE EXCLUDED.role
        END,
        status = 'active',
        invited_by = EXCLUDED.invited_by,
        updated_at = now();

  UPDATE indiebanca.band_invitations
  SET status = 'active', updated_at = now()
  WHERE id = invitation.id;

  RETURN invitation.band_id;
END;
$$;

REVOKE ALL ON FUNCTION indiebanca.accept_band_invitation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION indiebanca.accept_band_invitation(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION indiebanca.set_band_support(_band_id uuid, _enabled boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = indiebanca
AS $$
DECLARE is_verified boolean;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
    AND NOT indiebanca.is_band_member(_band_id, ARRAY['owner', 'admin']::indiebanca.band_member_role[]) THEN
    RAISE EXCEPTION 'Only band owners and administrators can change support settings';
  END IF;

  SELECT verified INTO is_verified FROM indiebanca.bands WHERE id = _band_id FOR UPDATE;
  IF is_verified IS NULL THEN
    RAISE EXCEPTION 'Band not found';
  END IF;
  IF _enabled AND NOT is_verified THEN
    RAISE EXCEPTION 'Only verified bands can enable support';
  END IF;

  UPDATE indiebanca.bands SET support_enabled = _enabled WHERE id = _band_id;
END;
$$;

REVOKE ALL ON FUNCTION indiebanca.set_band_support(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION indiebanca.set_band_support(uuid, boolean) TO authenticated, service_role;

DROP POLICY IF EXISTS "Users submit claims" ON indiebanca.band_claims;
DROP POLICY IF EXISTS "Users submit claims for unverified bands" ON indiebanca.band_claims;
CREATE POLICY "Users submit claims for unverified bands"
  ON indiebanca.band_claims FOR INSERT TO authenticated
  WITH CHECK (
    claimant_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM indiebanca.bands b
      WHERE b.id = band_claims.band_id AND NOT b.verified
    )
  );

DROP POLICY IF EXISTS "Admins review claims" ON indiebanca.band_claims;
REVOKE UPDATE ON indiebanca.band_claims FROM authenticated;
REVOKE INSERT ON indiebanca.tips FROM authenticated;

CREATE OR REPLACE FUNCTION indiebanca.review_band_claim(
  _claim_id uuid,
  _decision indiebanca.claim_status,
  _notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = indiebanca
AS $$
DECLARE claim_row indiebanca.band_claims;
BEGIN
  IF NOT indiebanca.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only platform administrators can review claims';
  END IF;
  IF _decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid claim decision';
  END IF;

  SELECT * INTO claim_row
  FROM indiebanca.band_claims
  WHERE id = _claim_id AND status = 'pending'
  FOR UPDATE;

  IF claim_row.id IS NULL THEN
    RAISE EXCEPTION 'Pending claim not found';
  END IF;
  IF claim_row.claimant_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Administrators cannot review their own claims';
  END IF;

  UPDATE indiebanca.band_claims
  SET status = _decision,
      reviewer_user_id = auth.uid(),
      review_notes = _notes,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = _claim_id;

  IF _decision = 'approved' THEN
    UPDATE indiebanca.bands
    SET owner_user_id = claim_row.claimant_user_id,
        verified = true,
        verified_at = now()
    WHERE id = claim_row.band_id;

    INSERT INTO indiebanca.band_members (band_id, user_id, role, status, invited_by)
    VALUES (claim_row.band_id, claim_row.claimant_user_id, 'owner', 'active', auth.uid())
    ON CONFLICT (band_id, user_id) DO UPDATE
      SET role = 'owner', status = 'active', updated_at = now();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION indiebanca.review_band_claim(uuid, indiebanca.claim_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION indiebanca.review_band_claim(uuid, indiebanca.claim_status, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION indiebanca.approve_band_claim(uuid, text) FROM PUBLIC, anon, authenticated;