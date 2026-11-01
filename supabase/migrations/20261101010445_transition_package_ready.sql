-- D1: sin trigger, invoca create_invoice en la misma transacción que crea el estado 4
-- (Listo para recoger). Si algo falla, se revierten el estado y el recibo.
CREATE OR REPLACE FUNCTION public.transition_package_ready(
  p_package_id uuid,
  p_location text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_previous_status integer;
  v_invoice_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Solo administradores pueden marcar Listo para recoger';
  END IF;
  IF p_location IS NULL OR char_length(btrim(p_location)) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'La ubicación debe tener entre 1 y 200 caracteres';
  END IF;

  -- Bloqueo por paquete para serializar transiciones y evitar recibos dobles concurrentes.
  SELECT p.user_id INTO v_user_id FROM public.packages p
  WHERE p.id = p_package_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'No existe el paquete'; END IF;

  SELECT h.status_id INTO v_previous_status
  FROM public.package_status_history h
  WHERE h.package_id = p_package_id
  ORDER BY h.created_at DESC, h.id DESC LIMIT 1;
  IF v_previous_status IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION 'El paquete debe estar En aduana antes de marcar Listo para recoger';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.invoice_items ii
    JOIN public.invoices i ON i.id = ii.invoice_id
    WHERE ii.package_id = p_package_id AND i.status <> 'anulada'
  ) THEN
    RAISE EXCEPTION 'El paquete ya tiene un recibo activo';
  END IF;

  -- create_invoice mantiene cálculo de impuestos 0 y lógica de factura del backend.
  v_invoice_id := public.create_invoice(v_user_id, ARRAY[p_package_id]);
  INSERT INTO public.package_status_history(package_id, status_id, notes)
  VALUES (p_package_id, 4, btrim(p_location));

  -- Si la inserción de estado o un trigger falla, la transacción revierte TAMBIÉN el recibo.
  RETURN v_invoice_id;
END;
$$;
REVOKE ALL ON FUNCTION public.transition_package_ready(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transition_package_ready(uuid,text) FROM anon;
GRANT EXECUTE ON FUNCTION public.transition_package_ready(uuid,text) TO authenticated;
