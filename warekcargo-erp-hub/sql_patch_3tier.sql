BEGIN;

CREATE TABLE if not exists batch_containers (
    id uuid primary key default gen_random_uuid(),
    batch_id uuid not null references shipping_batches(id) on delete cascade,
    container_number text not null,
    seal_number text,
    container_type text not null default 'LAINNYA',
    max_weight_kg numeric(10,2),
    assigned_admin text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    UNIQUE(batch_id, container_number)
);

GRANT ALL PRIVILEGES ON TABLE batch_containers TO warekcargo_app;

DROP TRIGGER IF EXISTS trg_batch_containers_set_updated_at ON batch_containers;
CREATE TRIGGER trg_batch_containers_set_updated_at 
BEFORE UPDATE ON batch_containers 
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE customer_shipments ADD COLUMN IF NOT EXISTS batch_container_id uuid references batch_containers(id) on delete set null;

DO $$
DECLARE
    rec RECORD;
    new_ctr_id uuid;
BEGIN
    FOR rec IN SELECT DISTINCT batch_id, container_number FROM customer_shipments WHERE batch_id IS NOT NULL LOOP
        IF rec.container_number IS NULL OR trim(rec.container_number) = '' THEN
            SELECT id INTO new_ctr_id FROM batch_containers WHERE batch_id = rec.batch_id AND container_number = 'TERBUKA / BEBAS';
            IF NOT FOUND THEN
                INSERT INTO batch_containers (batch_id, container_number, container_type) 
                VALUES (rec.batch_id, 'TERBUKA / BEBAS', 'LAINNYA') RETURNING id INTO new_ctr_id;
            END IF;
            
            UPDATE customer_shipments SET batch_container_id = new_ctr_id 
            WHERE batch_id = rec.batch_id AND (container_number IS NULL OR trim(container_number) = '');
        ELSE
            SELECT id INTO new_ctr_id FROM batch_containers WHERE batch_id = rec.batch_id AND container_number = rec.container_number;
            IF NOT FOUND THEN
                INSERT INTO batch_containers (batch_id, container_number, container_type) 
                VALUES (rec.batch_id, rec.container_number, 'LAINNYA') RETURNING id INTO new_ctr_id;
            END IF;
            
            UPDATE customer_shipments SET batch_container_id = new_ctr_id 
            WHERE batch_id = rec.batch_id AND container_number = rec.container_number;
        END IF;
    END LOOP;
END $$;

COMMIT;
