


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."accept_delivery"("p_delivery_id" "uuid", "p_deliverer_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_updated int;
begin
  update deliveries
     set deliverer_id   = p_deliverer_id,
         deliverer_name = (select name || ' ' || coalesce(last_name,'')
                           from users where id = p_deliverer_id),
         status         = 'aceptado',
         accepted_at    = now()
   where id = p_delivery_id
     and status = 'disponible';
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;


ALTER FUNCTION "public"."accept_delivery"("p_delivery_id" "uuid", "p_deliverer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_delivery"("p_delivery_id" "uuid", "p_method" "text" DEFAULT 'efectivo'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_invoice_id uuid;
  v_total numeric;
  v_paid numeric;
  v_balance numeric;
begin
  -- 1) marcar entregada
  update deliveries set status = 'entregado', delivered_at = now()
   where id = p_delivery_id;

  -- 2) recibo asociado
  select invoice_id into v_invoice_id from deliveries where id = p_delivery_id;
  if v_invoice_id is null then
    return;
  end if;

  -- 3) saldo
  select total into v_total from invoices where id = v_invoice_id;
  select coalesce(sum(amount), 0) into v_paid from payments where invoice_id = v_invoice_id;
  v_balance := coalesce(v_total, 0) - v_paid;

  -- 4) cobrar solo si hay saldo, con el método indicado
  if v_balance > 0.009 then
    insert into payments (invoice_id, amount, method, registered_by)
    values (v_invoice_id, v_balance, p_method, auth.uid());
  end if;

  -- 5) cerrar recibo y marcar paquetes pagados
  update invoices set status = 'pagada' where id = v_invoice_id;
  update packages set is_paid = true
   where id in (select package_id from invoice_items where invoice_id = v_invoice_id);
end;
$$;


ALTER FUNCTION "public"."complete_delivery"("p_delivery_id" "uuid", "p_method" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_invoice"("p_user_id" "uuid", "p_package_ids" "uuid"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_invoice_id uuid;
  v_subtotal numeric;
begin
  if not is_admin_user() then
    raise exception 'Solo administradores pueden crear recibos';
  end if;
  if array_length(p_package_ids, 1) is null then
    raise exception 'Selecciona al menos un paquete';
  end if;

  select coalesce(sum(price), 0) into v_subtotal
    from packages where id = any(p_package_ids);

  insert into invoices (document_type, user_id, subtotal, tax_amount, total,
                        status, issued_by, has_delivery, delivery_cost)
  values ('recibo', p_user_id, v_subtotal, 0, v_subtotal,
          'pendiente', auth.uid(), false, 0)
  returning id into v_invoice_id;

  insert into invoice_items (invoice_id, package_id, description, amount)
  select v_invoice_id, p.id,
         coalesce(pt.name, 'Paquete') || ' · ' || p.weight || ' lb · ' || p.tracking_code,
         p.price
    from packages p
    left join package_types pt on pt.id = p.package_type_id
   where p.id = any(p_package_ids);

  return v_invoice_id;
end;
$$;


ALTER FUNCTION "public"."create_invoice"("p_user_id" "uuid", "p_package_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decline_delivery"("p_invoice_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not exists (select 1 from invoices where id = p_invoice_id and user_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;
  update invoices set delivery_choice = 'rechazado' where id = p_invoice_id;
end;
$$;


ALTER FUNCTION "public"."decline_delivery"("p_invoice_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delivery_balance"("p_delivery_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_invoice_id uuid;
  v_total numeric;
  v_paid numeric;
begin
  select invoice_id into v_invoice_id from deliveries where id = p_delivery_id;
  if v_invoice_id is null then
    return 0;
  end if;
  select total into v_total from invoices where id = v_invoice_id;
  select coalesce(sum(amount), 0) into v_paid from payments where invoice_id = v_invoice_id;
  return coalesce(v_total, 0) - v_paid;
end;
$$;


ALTER FUNCTION "public"."delivery_balance"("p_delivery_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fill_delivery_details"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  select name || ' ' || coalesce(last_name,''), phone
    into new.client_name, new.client_phone
    from users where id = new.client_id;

  select tracking_code into new.package_tracking
    from packages where id = new.package_id;

  return new;
end;
$$;


ALTER FUNCTION "public"."fill_delivery_details"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  casillero_generado text;
begin
  casillero_generado := 'NCX-' || upper(substr(new.id::text, 1, 6));

  insert into public.users (id, name, last_name, email, casillero, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email,
    casillero_generado,
    false
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select exists (
    select 1 from public.users 
    where id = auth.uid() and is_admin = true
  )
$$;


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_almacen"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists(
    select 1 from public.users where id = auth.uid() and role = 'almacen'
  );
$$;


ALTER FUNCTION "public"."is_almacen"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."promote_to_repartidor"("target_user_id" "uuid", "user_phone" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not exists (select 1 from users where id = auth.uid() and is_admin = true) then
    raise exception 'No autorizado';
  end if;

  update users 
  set role = 'repartidor',
      phone = coalesce(nullif(user_phone, ''), phone)
  where id = target_user_id;
end;
$$;


ALTER FUNCTION "public"."promote_to_repartidor"("target_user_id" "uuid", "user_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."register_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_method" "text", "p_reference" "text" DEFAULT NULL::"text", "p_bank_name" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_total numeric;
  v_paid numeric;
  v_status text;
begin
  if not is_admin_user() then
    raise exception 'Solo administradores pueden registrar pagos';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Monto inválido';
  end if;

  select total into v_total from invoices where id = p_invoice_id for update;
  if v_total is null then
    raise exception 'Recibo no encontrado';
  end if;

  select coalesce(sum(amount), 0) into v_paid
    from payments where invoice_id = p_invoice_id;

  if p_amount > (v_total - v_paid) + 0.009 then
    raise exception 'El monto supera el saldo pendiente';
  end if;

  insert into payments (invoice_id, amount, method, reference, bank_name, registered_by)
  values (p_invoice_id, p_amount, p_method, p_reference, p_bank_name, auth.uid());

  v_paid := v_paid + p_amount;
  v_status := case
    when v_paid >= v_total - 0.009 then 'pagada'
    when v_paid > 0 then 'parcial'
    else 'pendiente'
  end;

  update invoices set status = v_status where id = p_invoice_id;

  if v_status = 'pagada' then
    update packages set is_paid = true
     where id in (select package_id from invoice_items where invoice_id = p_invoice_id);
  end if;
end;
$$;


ALTER FUNCTION "public"."register_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_method" "text", "p_reference" "text", "p_bank_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_delivery"("p_invoice_id" "uuid", "p_package_id" "uuid", "p_delivery_address" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not exists (select 1 from invoices where id = p_invoice_id and user_id = auth.uid()) then
    raise exception 'No autorizado';
  end if;
  if exists (select 1 from deliveries where package_id = p_package_id) then
    raise exception 'Ya existe un delivery para este paquete';
  end if;
  update invoices set
    has_delivery = true,
    delivery_address = p_delivery_address,
    delivery_cost = 3.58,
    total = subtotal + 3.58,
    delivery_choice = 'solicitado'
  where id = p_invoice_id;
  insert into deliveries (invoice_id, package_id, client_id, delivery_address)
  values (p_invoice_id, p_package_id, auth.uid(), p_delivery_address);
end;
$$;


ALTER FUNCTION "public"."request_delivery"("p_invoice_id" "uuid", "p_package_id" "uuid", "p_delivery_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_delivery_multi"("p_package_ids" "uuid"[], "p_delivery_address" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_client uuid := auth.uid();
  v_delivery_id uuid;
  v_primary_pkg uuid := p_package_ids[1];
  v_primary_inv uuid;
  v_pkg uuid;
  v_inv uuid;
  v_subtotal numeric;
begin
  if array_length(p_package_ids, 1) is null then
    raise exception 'Sin paquetes';
  end if;

  -- recibo primario = recibo consolidado
  select invoice_id into v_primary_inv
    from invoice_items where package_id = v_primary_pkg limit 1;

  -- mover ítems de los demás paquetes al recibo primario y borrar sus recibos
  foreach v_pkg in array p_package_ids loop
    if v_pkg <> v_primary_pkg then
      select invoice_id into v_inv
        from invoice_items where package_id = v_pkg limit 1;
      if v_inv is not null and v_inv <> v_primary_inv then
        update invoice_items set invoice_id = v_primary_inv where invoice_id = v_inv;
        delete from invoices where id = v_inv;
      end if;
    end if;
  end loop;

  -- recalcular el recibo consolidado: subtotal de todos + 1 tarifa
  select coalesce(sum(amount),0) into v_subtotal
    from invoice_items where invoice_id = v_primary_inv;

  update invoices set
    subtotal = v_subtotal,
    has_delivery = true,
    delivery_address = p_delivery_address,
    delivery_choice = 'solicitado',
    delivery_cost = 3.58,
    total = v_subtotal + 3.58
  where id = v_primary_inv;

  -- crear el delivery ligado al recibo consolidado
  insert into deliveries (invoice_id, package_id, client_id, delivery_address, status)
  values (v_primary_inv, v_primary_pkg, v_client, p_delivery_address, 'disponible')
  returning id into v_delivery_id;

  -- vincular todos los paquetes
  foreach v_pkg in array p_package_ids loop
    insert into delivery_packages (delivery_id, package_id, invoice_id)
      values (v_delivery_id, v_pkg, v_primary_inv);
  end loop;

  update deliveries set
    package_count = array_length(p_package_ids, 1),
    package_tracking = (select string_agg(p.tracking_code, ', ')
                        from packages p where p.id = any(p_package_ids))
  where id = v_delivery_id;

  return v_delivery_id;
end;
$$;


ALTER FUNCTION "public"."request_delivery_multi"("p_package_ids" "uuid"[], "p_delivery_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.invoice_number is null then
    if new.document_type = 'recibo' then
      new.invoice_number := nextval('recibo_seq');
    else
      new.invoice_number := nextval('factura_seq');
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."set_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_deliverer_location"("p_delivery_id" "uuid", "p_lat" double precision, "p_lng" double precision) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update deliveries
     set deliverer_lat = p_lat,
         deliverer_lng = p_lng,
         location_updated_at = now()
   where id = p_delivery_id
     and deliverer_id = auth.uid()
     and status in ('aceptado','en_camino');
end;
$$;


ALTER FUNCTION "public"."update_deliverer_location"("p_delivery_id" "uuid", "p_lat" double precision, "p_lng" double precision) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "package_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "deliverer_id" "uuid",
    "status" "text" DEFAULT 'disponible'::"text" NOT NULL,
    "delivery_address" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "on_the_way_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "deliverer_name" "text",
    "deliverer_lat" double precision,
    "deliverer_lng" double precision,
    "location_updated_at" timestamp with time zone,
    "client_name" "text",
    "client_phone" "text",
    "package_tracking" "text",
    "package_count" integer DEFAULT 1,
    "proof_url" "text",
    CONSTRAINT "deliveries_status_check" CHECK (("status" = ANY (ARRAY['disponible'::"text", 'aceptado'::"text", 'en_camino'::"text", 'entregado'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_id" "uuid" NOT NULL,
    "package_id" "uuid" NOT NULL,
    "invoice_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."delivery_packages" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."factura_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."factura_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "package_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_type" "text" DEFAULT 'recibo'::"text" NOT NULL,
    "invoice_number" bigint,
    "user_id" "uuid" NOT NULL,
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "tax_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "total" numeric(10,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "dgi_authorization_number" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "issued_by" "uuid",
    "has_delivery" boolean DEFAULT false NOT NULL,
    "delivery_address" "text",
    "delivery_cost" numeric(10,2) DEFAULT 0 NOT NULL,
    "delivery_choice" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    CONSTRAINT "invoices_delivery_choice_check" CHECK (("delivery_choice" = ANY (ARRAY['pendiente'::"text", 'solicitado'::"text", 'rechazado'::"text"]))),
    CONSTRAINT "invoices_document_type_check" CHECK (("document_type" = ANY (ARRAY['recibo'::"text", 'factura'::"text"]))),
    CONSTRAINT "invoices_status_check" CHECK (("status" = ANY (ARRAY['pendiente'::"text", 'pagada'::"text", 'parcial'::"text", 'anulada'::"text"])))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."package_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "package_id" "uuid" NOT NULL,
    "status_id" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."package_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."package_types" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."package_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tracking_code" "text" NOT NULL,
    "shipping_method_id" integer NOT NULL,
    "package_type_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "weight" numeric DEFAULT 0 NOT NULL,
    "price" numeric DEFAULT 0 NOT NULL,
    "is_paid" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "method" "text" NOT NULL,
    "reference" "text",
    "bank_name" "text",
    "registered_by" "uuid",
    "paid_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_method_check" CHECK (("method" = ANY (ARRAY['efectivo'::"text", 'transferencia'::"text", 'tarjeta_datafono'::"text", 'tarjeta_online'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."recibo_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."recibo_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_methods" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."shipping_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."status_types" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."status_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_push_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_push_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "casillero" "text" NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "address" "text",
    "phone" "text",
    "role" "text" DEFAULT 'cliente'::"text" NOT NULL,
    "is_available" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_role_check" CHECK ((("role" IS NULL) OR ("role" = ANY (ARRAY['cliente'::"text", 'admin'::"text", 'repartidor'::"text", 'almacen'::"text"]))))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_packages"
    ADD CONSTRAINT "delivery_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."package_status_history"
    ADD CONSTRAINT "package_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."package_types"
    ADD CONSTRAINT "package_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."package_types"
    ADD CONSTRAINT "package_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_tracking_code_key" UNIQUE ("tracking_code");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_methods"
    ADD CONSTRAINT "shipping_methods_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."shipping_methods"
    ADD CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_types"
    ADD CONSTRAINT "status_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."status_types"
    ADD CONSTRAINT "status_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_push_tokens"
    ADD CONSTRAINT "user_push_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_push_tokens"
    ADD CONSTRAINT "user_push_tokens_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_casillero_key" UNIQUE ("casillero");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_package_status_history_package_id" ON "public"."package_status_history" USING "btree" ("package_id");



CREATE INDEX "idx_packages_user_id" ON "public"."packages" USING "btree" ("user_id");



CREATE INDEX "idx_users_is_admin" ON "public"."users" USING "btree" ("id", "is_admin");



CREATE UNIQUE INDEX "invoices_number_per_type" ON "public"."invoices" USING "btree" ("document_type", "invoice_number");



CREATE OR REPLACE TRIGGER "on_package_status_insert" AFTER INSERT ON "public"."package_status_history" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://dbzbfhlzdwbliviwhehf.supabase.co/functions/v1/send-push-notification', 'POST', '{"Content-type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY_REDACTADA>","x-webhook-secret":"<WEBHOOK_SECRET_REDACTADO>"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "trg_fill_delivery_details" BEFORE INSERT ON "public"."deliveries" FOR EACH ROW EXECUTE FUNCTION "public"."fill_delivery_details"();



CREATE OR REPLACE TRIGGER "trg_invoice_number" BEFORE INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_invoice_number"();



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_deliverer_id_fkey" FOREIGN KEY ("deliverer_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id");



ALTER TABLE ONLY "public"."delivery_packages"
    ADD CONSTRAINT "delivery_packages_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_packages"
    ADD CONSTRAINT "delivery_packages_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."delivery_packages"
    ADD CONSTRAINT "delivery_packages_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."package_status_history"
    ADD CONSTRAINT "package_status_history_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."package_status_history"
    ADD CONSTRAINT "package_status_history_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."status_types"("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_package_type_id_fkey" FOREIGN KEY ("package_type_id") REFERENCES "public"."package_types"("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_shipping_method_id_fkey" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id");



ALTER TABLE ONLY "public"."packages"
    ADD CONSTRAINT "packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_push_tokens"
    ADD CONSTRAINT "user_push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete package status history" ON "public"."package_status_history" FOR DELETE TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can insert package status history" ON "public"."package_status_history" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can insert packages" ON "public"."packages" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can read all package status history" ON "public"."package_status_history" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can read all packages" ON "public"."packages" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can read all users" ON "public"."users" FOR SELECT TO "authenticated" USING (("public"."is_admin_user"() OR ("id" = "auth"."uid"())));



CREATE POLICY "Admins can update package status history" ON "public"."package_status_history" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Admins can update packages" ON "public"."packages" FOR UPDATE TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Authenticated can read package types" ON "public"."package_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated can read shipping methods" ON "public"."shipping_methods" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated can read status types" ON "public"."status_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can manage own token" ON "public"."user_push_tokens" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own package status history" ON "public"."package_status_history" FOR SELECT TO "authenticated" USING (("public"."is_admin_user"() OR (EXISTS ( SELECT 1
   FROM "public"."packages" "p"
  WHERE (("p"."id" = "package_status_history"."package_id") AND ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can read own packages" ON "public"."packages" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin_user"()));



CREATE POLICY "Users can read own profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "admins manage deliveries" ON "public"."deliveries" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "admins manage invoice items" ON "public"."invoice_items" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."is_admin" = true)))));



CREATE POLICY "admins manage invoices" ON "public"."invoices" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."is_admin" = true)))));



CREATE POLICY "admins manage payments" ON "public"."payments" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."is_admin" = true)))));



CREATE POLICY "almacen_insert_packages" ON "public"."packages" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_almacen"());



CREATE POLICY "almacen_insert_psh" ON "public"."package_status_history" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_almacen"() AND ("status_id" = ANY (ARRAY[1, 2]))));



CREATE POLICY "almacen_select_packages" ON "public"."packages" FOR SELECT TO "authenticated" USING ("public"."is_almacen"());



CREATE POLICY "almacen_select_psh" ON "public"."package_status_history" FOR SELECT TO "authenticated" USING ("public"."is_almacen"());



CREATE POLICY "almacen_select_users" ON "public"."users" FOR SELECT TO "authenticated" USING ("public"."is_almacen"());



CREATE POLICY "almacen_update_packages" ON "public"."packages" FOR UPDATE TO "authenticated" USING ("public"."is_almacen"()) WITH CHECK ("public"."is_almacen"());



CREATE POLICY "auth read delivery_packages" ON "public"."delivery_packages" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "clients see own deliveries" ON "public"."deliveries" FOR SELECT USING (("client_id" = "auth"."uid"()));



ALTER TABLE "public"."deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."package_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."package_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."packages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "repartidores select deliveries" ON "public"."deliveries" FOR SELECT USING ((("status" = 'disponible'::"text") OR ("deliverer_id" = "auth"."uid"())));



CREATE POLICY "repartidores update own" ON "public"."deliveries" FOR UPDATE USING (("deliverer_id" = "auth"."uid"()));



ALTER TABLE "public"."shipping_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."status_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_push_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users select own invoice items" ON "public"."invoice_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_items"."invoice_id") AND ("i"."user_id" = "auth"."uid"())))));



CREATE POLICY "users select own invoices" ON "public"."invoices" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users select own payments" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "payments"."invoice_id") AND ("i"."user_id" = "auth"."uid"())))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_delivery"("p_delivery_id" "uuid", "p_deliverer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_delivery"("p_delivery_id" "uuid", "p_deliverer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_delivery"("p_delivery_id" "uuid", "p_deliverer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_delivery"("p_delivery_id" "uuid", "p_method" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_delivery"("p_delivery_id" "uuid", "p_method" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_delivery"("p_delivery_id" "uuid", "p_method" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_invoice"("p_user_id" "uuid", "p_package_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_invoice"("p_user_id" "uuid", "p_package_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invoice"("p_user_id" "uuid", "p_package_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."decline_delivery"("p_invoice_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decline_delivery"("p_invoice_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decline_delivery"("p_invoice_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delivery_balance"("p_delivery_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delivery_balance"("p_delivery_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delivery_balance"("p_delivery_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fill_delivery_details"() TO "anon";
GRANT ALL ON FUNCTION "public"."fill_delivery_details"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fill_delivery_details"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_almacen"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_almacen"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_almacen"() TO "service_role";



GRANT ALL ON FUNCTION "public"."promote_to_repartidor"("target_user_id" "uuid", "user_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."promote_to_repartidor"("target_user_id" "uuid", "user_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."promote_to_repartidor"("target_user_id" "uuid", "user_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_method" "text", "p_reference" "text", "p_bank_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."register_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_method" "text", "p_reference" "text", "p_bank_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_payment"("p_invoice_id" "uuid", "p_amount" numeric, "p_method" "text", "p_reference" "text", "p_bank_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_delivery"("p_invoice_id" "uuid", "p_package_id" "uuid", "p_delivery_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."request_delivery"("p_invoice_id" "uuid", "p_package_id" "uuid", "p_delivery_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_delivery"("p_invoice_id" "uuid", "p_package_id" "uuid", "p_delivery_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."request_delivery_multi"("p_package_ids" "uuid"[], "p_delivery_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."request_delivery_multi"("p_package_ids" "uuid"[], "p_delivery_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_delivery_multi"("p_package_ids" "uuid"[], "p_delivery_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_deliverer_location"("p_delivery_id" "uuid", "p_lat" double precision, "p_lng" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."update_deliverer_location"("p_delivery_id" "uuid", "p_lat" double precision, "p_lng" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_deliverer_location"("p_delivery_id" "uuid", "p_lat" double precision, "p_lng" double precision) TO "service_role";



GRANT ALL ON TABLE "public"."deliveries" TO "anon";
GRANT ALL ON TABLE "public"."deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_packages" TO "anon";
GRANT ALL ON TABLE "public"."delivery_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_packages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."factura_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."factura_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."factura_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."package_status_history" TO "anon";
GRANT ALL ON TABLE "public"."package_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."package_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."package_types" TO "anon";
GRANT ALL ON TABLE "public"."package_types" TO "authenticated";
GRANT ALL ON TABLE "public"."package_types" TO "service_role";



GRANT ALL ON TABLE "public"."packages" TO "anon";
GRANT ALL ON TABLE "public"."packages" TO "authenticated";
GRANT ALL ON TABLE "public"."packages" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."recibo_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."recibo_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."recibo_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_methods" TO "anon";
GRANT ALL ON TABLE "public"."shipping_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_methods" TO "service_role";



GRANT ALL ON TABLE "public"."status_types" TO "anon";
GRANT ALL ON TABLE "public"."status_types" TO "authenticated";
GRANT ALL ON TABLE "public"."status_types" TO "service_role";



GRANT ALL ON TABLE "public"."user_push_tokens" TO "anon";
GRANT ALL ON TABLE "public"."user_push_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."user_push_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







