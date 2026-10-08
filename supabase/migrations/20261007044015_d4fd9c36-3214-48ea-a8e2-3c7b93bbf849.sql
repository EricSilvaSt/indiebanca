REVOKE ALL ON FUNCTION indiebanca.approve_band_claim(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION indiebanca.approve_band_claim(uuid, text) TO service_role;
REVOKE ALL ON FUNCTION indiebanca.is_band_member(uuid, indiebanca.band_member_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION indiebanca.is_band_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION indiebanca.notify_band_followers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION indiebanca.notify_band_followers() TO service_role;
REVOKE ALL ON FUNCTION indiebanca.has_role(uuid, indiebanca.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION indiebanca.user_owns_order(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION indiebanca.band_owner_has_item_in_order(uuid) FROM PUBLIC, anon;