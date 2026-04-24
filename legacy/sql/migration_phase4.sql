BEGIN;

-- 1. Create employees table
CREATE TABLE IF NOT EXISTS public.employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_id uuid REFERENCES public.hubs(id) ON DELETE SET NULL,
    full_name text NOT NULL,
    whatsapp_number text UNIQUE NOT NULL,
    role text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_whatsapp_number 
ON public.employees(whatsapp_number);

-- Add trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_employees_set_updated_at'
    ) THEN
        CREATE TRIGGER trg_employees_set_updated_at
        BEFORE UPDATE ON public.employees
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END
$$;

-- 2. Add relational attribution to inbound_packages
ALTER TABLE public.inbound_packages 
ADD COLUMN IF NOT EXISTS created_by_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- 3. Add relational attribution to status history
ALTER TABLE public.inbound_package_status_history 
ADD COLUMN IF NOT EXISTS changed_by_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

COMMIT;
