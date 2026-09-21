REVOKE ALL ON FUNCTION public.is_pmc_team(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION public.can_see_owner_request(uuid, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_pmc_team(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_owner_request(uuid, text, text) TO authenticated;