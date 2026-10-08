
REVOKE EXECUTE ON FUNCTION indiebanca.has_role(UUID, indiebanca.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION indiebanca.is_band_owner(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION indiebanca.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION indiebanca.handle_new_user() FROM PUBLIC, anon, authenticated;
