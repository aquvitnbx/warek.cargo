BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. Reference status alignment
-- ============================================================

INSERT INTO public.ref_package_statuses (code, name, sort_order)
VALUES
    ('REGISTERED', 'Registered', 1),
    ('IN_TRANSIT_TO_HUB', 'In Transit to Hub', 2),
    ('AWAITING_HUB_RECEIPT', 'Awaiting Hub Receipt', 3),
    ('RECEIVED_AT_HUB', 'Received at Hub', 4),
    ('REPACKING', 'Repacking', 5),
    ('READY_FOR_BATCH', 'Ready for Batch', 6),
    ('ARRIVED_DESTINATION', 'Arrived Destination', 7),
    ('DELIVERED', 'Delivered', 8),
    ('DAMAGED', 'Damaged', 9),
    ('UNIDENTIFIED', 'Unidentified', 10),
    ('CANCELLED', 'Cancelled', 11)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.ref_shipment_statuses (code, name, sort_order)
VALUES
    ('DRAFT', 'Draft', 1),
    ('AWAITING_PACKAGES', 'Awaiting Packages', 2),
    ('READY_FOR_DISPATCH', 'Ready for Dispatch', 3),
    ('MANIFESTED', 'Manifested', 4),
    ('DISPATCHED', 'Dispatched', 5),
    ('ARRIVED_DESTINATION', 'Arrived at Destination Hub', 6),
    ('READY_FOR_PICKUP', 'Ready for Pickup', 7),
    ('OUT_FOR_DELIVERY', 'Out for Delivery', 8),
    ('COMPLETED', 'Completed', 9),
    ('CANCELLED', 'Cancelled', 10)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.ref_payment_statuses (code, name, sort_order)
VALUES
    ('PENDING', 'Pending', 1),
    ('PARTIAL', 'Partial', 2),
    ('PAID', 'Paid', 3),
    ('REFUND_PENDING', 'Refund Pending', 4),
    ('VOIDED', 'Voided', 5),
    ('CANCELLED', 'Cancelled', 6)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 2. Structural additions required by schema v4
-- ============================================================

CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id uuid REFERENCES public.hubs(id) ON DELETE SET NULL,
    full_name text NOT NULL,
    whatsapp_number text UNIQUE NOT NULL,
    role text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_whatsapp_number
ON public.employees(whatsapp_number);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_employees_set_updated_at'
    ) THEN
        CREATE TRIGGER trg_employees_set_updated_at
        BEFORE UPDATE ON public.employees
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.batch_containers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id uuid NOT NULL REFERENCES public.shipping_batches(id) ON DELETE CASCADE,
    container_number text NOT NULL,
    seal_number text,
    container_type text NOT NULL DEFAULT 'LAINNYA',
    destination_city text NOT NULL DEFAULT 'Nabire',
    max_weight_kg numeric(10,2),
    assigned_admin text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE(batch_id, container_number)
);

CREATE INDEX IF NOT EXISTS idx_batch_containers_batch_id
ON public.batch_containers(batch_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_batch_containers_set_updated_at'
    ) THEN
        CREATE TRIGGER trg_batch_containers_set_updated_at
        BEFORE UPDATE ON public.batch_containers
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

ALTER TABLE public.customer_shipments
ADD COLUMN IF NOT EXISTS batch_container_id uuid;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'customer_shipments'
          AND con.conname = 'fk_customer_shipments_batch_container_id'
    ) THEN
        ALTER TABLE public.customer_shipments
        ADD CONSTRAINT fk_customer_shipments_batch_container_id
        FOREIGN KEY (batch_container_id) REFERENCES public.batch_containers(id) ON DELETE SET NULL;
    END IF;
END $$;

ALTER TABLE public.inbound_packages
ADD COLUMN IF NOT EXISTS created_by_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

ALTER TABLE public.inbound_package_status_history
ADD COLUMN IF NOT EXISTS changed_by_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customer_shipments_batch_container_id
ON public.customer_shipments(batch_container_id);

ALTER TABLE public.customers
ALTER COLUMN whatsapp_number DROP NOT NULL;

-- ============================================================
-- 3. Notifications constraint alignment
-- ============================================================

DO $$
DECLARE
    constraint_name text;
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'notifications_log'
    ) THEN
        FOR constraint_name IN
            SELECT con.conname
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE nsp.nspname = 'public'
              AND rel.relname = 'notifications_log'
              AND con.contype = 'c'
              AND pg_get_constraintdef(con.oid) ILIKE '%delivery_status_code%'
        LOOP
            EXECUTE format('ALTER TABLE public.notifications_log DROP CONSTRAINT IF EXISTS %I', constraint_name);
        END LOOP;

        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
            WHERE nsp.nspname = 'public'
              AND rel.relname = 'notifications_log'
              AND con.conname = 'chk_notifications_log_delivery_status_code'
        ) THEN
            ALTER TABLE public.notifications_log
            ADD CONSTRAINT chk_notifications_log_delivery_status_code
            CHECK (delivery_status_code IN ('QUEUED', 'SENT', 'FAILED', 'SKIPPED', 'CANCELLED'));
        END IF;
    END IF;
END $$;

-- ============================================================
-- 4. Data backfill for v4 canonical structures
-- ============================================================

INSERT INTO public.batch_containers (
    batch_id,
    container_number,
    container_type,
    destination_city,
    assigned_admin,
    notes
)
SELECT
    s.batch_id,
    UPPER(BTRIM(s.container_number)) AS container_number,
    'LAINNYA' AS container_type,
    COALESCE(MAX(NULLIF(BTRIM(c.destination_city), '')), 'Nabire') AS destination_city,
    MAX(s.assigned_admin) AS assigned_admin,
    'Backfilled from customer_shipments.container_number during migration_to_schema_v4.sql' AS notes
FROM public.customer_shipments s
LEFT JOIN public.customers c ON c.id = s.customer_id
WHERE s.batch_id IS NOT NULL
  AND s.container_number IS NOT NULL
  AND BTRIM(s.container_number) <> ''
GROUP BY s.batch_id, UPPER(BTRIM(s.container_number))
ON CONFLICT (batch_id, container_number) DO NOTHING;

UPDATE public.customer_shipments s
SET batch_container_id = bc.id
FROM public.batch_containers bc
WHERE s.batch_container_id IS NULL
  AND s.batch_id = bc.batch_id
  AND s.container_number IS NOT NULL
  AND UPPER(BTRIM(s.container_number)) = bc.container_number;

UPDATE public.inbound_package_status_history
SET to_status_code = 'AWAITING_HUB_RECEIPT'
WHERE to_status_code = 'RECEIVED_AT_HUB'
  AND changed_source = 'NALA_BOT'
  AND change_notes ILIKE '%WhatsApp Nala Bot%';

UPDATE public.inbound_packages p
SET package_status_code = 'AWAITING_HUB_RECEIPT'
WHERE package_status_code = 'RECEIVED_AT_HUB'
  AND received_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM public.inbound_package_status_history h
      WHERE h.inbound_package_id = p.id
        AND h.changed_source = 'NALA_BOT'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM public.inbound_package_status_history h2
      WHERE h2.inbound_package_id = p.id
        AND COALESCE(h2.changed_source, '') <> 'NALA_BOT'
  );

UPDATE public.customer_shipments
SET payment_status_code = 'REFUND_PENDING',
    updated_at = NOW()
WHERE COALESCE(final_charge_amount, 0) > 0
  AND COALESCE(amount_paid, 0) > COALESCE(final_charge_amount, 0)
  AND payment_status_code NOT IN ('REFUND_PENDING', 'VOIDED', 'CANCELLED');

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'customer_shipments'
          AND column_name = 'paid_at'
    ) THEN
        UPDATE public.customer_shipments
        SET paid_at = NULL,
            updated_at = NOW()
        WHERE payment_status_code IN ('PENDING', 'PARTIAL', 'REFUND_PENDING', 'VOIDED', 'CANCELLED')
          AND paid_at IS NOT NULL;
    END IF;
END $$;

COMMIT;
