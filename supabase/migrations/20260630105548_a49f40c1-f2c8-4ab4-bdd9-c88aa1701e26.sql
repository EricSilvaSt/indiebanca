
-- Grant execute on helper functions (RLS policies need them)
GRANT EXECUTE ON FUNCTION indiebanca.is_band_owner(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION indiebanca.has_role(uuid, indiebanca.app_role) TO authenticated, anon;

-- Security-definer helpers to break RLS recursion between orders <-> order_items
CREATE OR REPLACE FUNCTION indiebanca.user_owns_order(_order_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = indiebanca
AS $$ SELECT EXISTS (SELECT 1 FROM indiebanca.orders WHERE id = _order_id AND user_id = auth.uid()); $$;

CREATE OR REPLACE FUNCTION indiebanca.band_owner_has_item_in_order(_order_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = indiebanca
AS $$
  SELECT EXISTS (
    SELECT 1 FROM indiebanca.order_items oi
    JOIN indiebanca.bands b ON b.id = oi.band_id
    WHERE oi.order_id = _order_id AND b.owner_user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION indiebanca.user_owns_order(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION indiebanca.band_owner_has_item_in_order(uuid) TO authenticated;

-- Rewrite recursive policies on orders
DROP POLICY IF EXISTS "Band owners view orders containing their items" ON indiebanca.orders;
DROP POLICY IF EXISTS "Band owners update orders containing their items" ON indiebanca.orders;

CREATE POLICY "Band owners view orders containing their items"
ON indiebanca.orders FOR SELECT TO authenticated
USING (indiebanca.band_owner_has_item_in_order(id));

CREATE POLICY "Band owners update orders containing their items"
ON indiebanca.orders FOR UPDATE TO authenticated
USING (indiebanca.band_owner_has_item_in_order(id));

-- Rewrite recursive policies on order_items
DROP POLICY IF EXISTS "Buyers view own order items" ON indiebanca.order_items;
DROP POLICY IF EXISTS "Buyers insert own order items" ON indiebanca.order_items;

CREATE POLICY "Buyers view own order items"
ON indiebanca.order_items FOR SELECT TO authenticated
USING (indiebanca.user_owns_order(order_id));

CREATE POLICY "Buyers insert own order items"
ON indiebanca.order_items FOR INSERT TO authenticated
WITH CHECK (indiebanca.user_owns_order(order_id));
