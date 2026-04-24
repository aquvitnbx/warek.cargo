BEGIN;

-- 1. Drop NOT NULL constraint on whatsapp_number
ALTER TABLE public.customers ALTER COLUMN whatsapp_number DROP NOT NULL;

-- (The UNIQUE constraint on whatsapp_number already exists and automatically ignores NULLs in standard PostgreSQL)

COMMIT;
