REVOKE EXECUTE ON FUNCTION public.next_po_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.next_po_number() TO authenticated;