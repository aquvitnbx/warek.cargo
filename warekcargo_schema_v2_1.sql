-- WarekCargo PostgreSQL Schema v2.1
-- Adds auditability, actual measurements, delivery details, payment transactions,
-- admin responsibility, and operational issue tracking.

create extension if not exists pgcrypto;

create table if not exists customers (
    id uuid primary key default gen_random_uuid(),
    customer_code text unique,
    full_name text not null,
    whatsapp_number text not null unique,
    destination_city text not null default 'Nabire',
    destination_district text,
    address text,
    notes text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists hubs (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    city text not null,
    province text,
    address text,
    contact_name text,
    contact_phone text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists shipping_batches (
    id uuid primary key default gen_random_uuid(),
    batch_code text not null unique,
    hub_id uuid not null references hubs(id),
    origin_port text,
    destination_port text,
    destination_city text not null default 'Nabire',
    service_type text not null check (service_type in ('hemat', 'cepat', 'express')),
    transport_mode text not null check (transport_mode in ('kapal_kargo', 'kapal_penumpang', 'pesawat')),
    vessel_name text,
    voyage_number text,
    container_number text,
    assigned_admin text,
    closing_at timestamptz not null,
    etd_at timestamptz not null,
    eta_at timestamptz,
    status text not null default 'planned' check (status in ('planned', 'open', 'closed', 'departed', 'arrived', 'completed', 'cancelled')),
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists customer_batch_interests (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references customers(id) on delete cascade,
    batch_id uuid not null references shipping_batches(id) on delete cascade,
    selected_service_type text not null check (selected_service_type in ('hemat', 'cepat', 'express')),
    status text not null default 'interested' check (status in ('interested', 'confirmed', 'cancelled', 'moved_to_next_batch')),
    notes text,
    created_at timestamptz not null default now(),
    unique (customer_id, batch_id)
);

create table if not exists inbound_packages (
    id uuid primary key default gen_random_uuid(),
    package_ticket_code text unique,
    customer_id uuid references customers(id) on delete set null,
    hub_id uuid not null references hubs(id),
    target_batch_id uuid references shipping_batches(id) on delete set null,
    tracking_number text not null unique,
    sender_or_store text,
    marketplace_name text,
    item_description text,
    quantity integer not null default 1 check (quantity > 0),
    estimated_weight_kg numeric(10,2),
    estimated_volume_m3 numeric(10,4),
    actual_weight_kg numeric(10,2),
    actual_volume_m3 numeric(10,4),
    package_status text not null default 'registered' check (package_status in (
        'registered',
        'in_transit_to_hub',
        'received_at_hub',
        'damaged',
        'unidentified',
        'repacking',
        'ready_for_batch',
        'shipped',
        'arrived_destination',
        'delivered',
        'cancelled'
    )),
    is_cod boolean not null default false,
    assigned_admin text,
    customer_declared_at timestamptz,
    received_at timestamptz,
    delivered_at timestamptz,
    received_by text,
    condition_notes text,
    admin_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists inbound_package_status_history (
    id uuid primary key default gen_random_uuid(),
    inbound_package_id uuid not null references inbound_packages(id) on delete cascade,
    from_status text,
    to_status text not null,
    changed_by text,
    change_notes text,
    changed_at timestamptz not null default now()
);

create table if not exists package_photos (
    id uuid primary key default gen_random_uuid(),
    inbound_package_id uuid not null references inbound_packages(id) on delete cascade,
    photo_type text not null check (photo_type in ('package', 'label', 'damage', 'other')),
    file_path text not null,
    original_filename text,
    mime_type text,
    uploaded_by text,
    uploaded_at timestamptz not null default now()
);

create table if not exists customer_shipments (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references customers(id),
    batch_id uuid not null references shipping_batches(id),
    shipment_code text not null unique,
    final_service_type text not null check (final_service_type in ('hemat', 'cepat', 'express')),
    container_number text,
    vessel_name text,
    voyage_number text,
    total_weight_kg numeric(10,2),
    total_volume_m3 numeric(10,4),
    final_charge_amount numeric(14,2),
    amount_paid numeric(14,2) not null default 0,
    payment_method text check (payment_method in ('pay_on_pickup', 'bank_transfer', 'cash', 'other')),
    payment_status text not null default 'pending' check (payment_status in ('pending', 'partial', 'paid', 'cancelled')),
    payment_due_at timestamptz,
    shipment_status text not null default 'draft' check (shipment_status in (
        'draft',
        'awaiting_packages',
        'ready_for_dispatch',
        'dispatched',
        'arrived_nabire',
        'ready_for_pickup',
        'out_for_delivery',
        'completed',
        'cancelled'
    )),
    requires_last_mile boolean not null default false,
    last_mile_fee numeric(14,2),
    pickup_or_delivery_status text not null default 'not_ready' check (pickup_or_delivery_status in ('not_ready', 'ready_for_pickup', 'picked_up', 'out_for_delivery', 'delivered')),
    delivery_recipient_name text,
    delivery_phone text,
    delivery_address text,
    delivery_notes text,
    assigned_admin text,
    paid_at timestamptz,
    completed_at timestamptz,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists shipment_status_history (
    id uuid primary key default gen_random_uuid(),
    shipment_id uuid not null references customer_shipments(id) on delete cascade,
    from_status text,
    to_status text not null,
    changed_by text,
    change_notes text,
    changed_at timestamptz not null default now()
);

create table if not exists shipment_packages (
    id uuid primary key default gen_random_uuid(),
    shipment_id uuid not null references customer_shipments(id) on delete cascade,
    inbound_package_id uuid not null references inbound_packages(id) on delete cascade,
    added_at timestamptz not null default now(),
    unique (shipment_id, inbound_package_id)
);

create table if not exists shipment_payments (
    id uuid primary key default gen_random_uuid(),
    shipment_id uuid not null references customer_shipments(id) on delete cascade,
    amount numeric(14,2) not null check (amount >= 0),
    payment_method text not null check (payment_method in ('pay_on_pickup', 'bank_transfer', 'cash', 'other')),
    payment_reference text,
    paid_to text,
    notes text,
    paid_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

create table if not exists shipment_payment_proofs (
    id uuid primary key default gen_random_uuid(),
    shipment_id uuid not null references customer_shipments(id) on delete cascade,
    shipment_payment_id uuid references shipment_payments(id) on delete set null,
    file_path text not null,
    original_filename text,
    mime_type text,
    uploaded_by text,
    notes text,
    uploaded_at timestamptz not null default now()
);

create table if not exists operational_issues (
    id uuid primary key default gen_random_uuid(),
    issue_code text unique,
    issue_scope text not null check (issue_scope in ('package', 'shipment', 'batch', 'payment', 'customer')),
    issue_type text not null,
    issue_status text not null default 'open' check (issue_status in ('open', 'investigating', 'resolved', 'cancelled')),
    customer_id uuid references customers(id) on delete set null,
    inbound_package_id uuid references inbound_packages(id) on delete set null,
    shipment_id uuid references customer_shipments(id) on delete set null,
    batch_id uuid references shipping_batches(id) on delete set null,
    reported_by text,
    assigned_admin text,
    title text not null,
    description text,
    resolution_notes text,
    opened_at timestamptz not null default now(),
    resolved_at timestamptz
);

create table if not exists notifications_log (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid references customers(id) on delete set null,
    inbound_package_id uuid references inbound_packages(id) on delete set null,
    shipment_id uuid references customer_shipments(id) on delete set null,
    batch_id uuid references shipping_batches(id) on delete set null,
    channel text not null check (channel in ('whatsapp', 'telegram', 'instagram', 'manual')),
    notification_type text not null,
    message_content text not null,
    provider_message_id text,
    retry_count integer not null default 0,
    error_reason text,
    delivery_status text not null default 'queued' check (delivery_status in ('queued', 'sent', 'failed', 'cancelled')),
    sent_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists idx_customers_customer_code on customers(customer_code);
create index if not exists idx_inbound_packages_customer_id on inbound_packages(customer_id);
create index if not exists idx_inbound_packages_hub_id on inbound_packages(hub_id);
create index if not exists idx_inbound_packages_target_batch_id on inbound_packages(target_batch_id);
create index if not exists idx_inbound_packages_status on inbound_packages(package_status);
create index if not exists idx_inbound_package_status_history_package_id on inbound_package_status_history(inbound_package_id);
create index if not exists idx_shipping_batches_hub_id on shipping_batches(hub_id);
create index if not exists idx_shipping_batches_status on shipping_batches(status);
create index if not exists idx_customer_shipments_customer_id on customer_shipments(customer_id);
create index if not exists idx_customer_shipments_batch_id on customer_shipments(batch_id);
create index if not exists idx_customer_shipments_payment_status on customer_shipments(payment_status);
create index if not exists idx_customer_shipments_pickup_delivery_status on customer_shipments(pickup_or_delivery_status);
create index if not exists idx_shipment_status_history_shipment_id on shipment_status_history(shipment_id);
create index if not exists idx_shipment_payments_shipment_id on shipment_payments(shipment_id);
create index if not exists idx_shipment_payment_proofs_shipment_id on shipment_payment_proofs(shipment_id);
create index if not exists idx_shipment_payment_proofs_payment_id on shipment_payment_proofs(shipment_payment_id);
create index if not exists idx_operational_issues_scope_status on operational_issues(issue_scope, issue_status);
create index if not exists idx_notifications_log_customer_id on notifications_log(customer_id);

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS trg_customers_set_updated_at ON customers;
create trigger trg_customers_set_updated_at
before update on customers
for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_hubs_set_updated_at ON hubs;
create trigger trg_hubs_set_updated_at
before update on hubs
for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_shipping_batches_set_updated_at ON shipping_batches;
create trigger trg_shipping_batches_set_updated_at
before update on shipping_batches
for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_inbound_packages_set_updated_at ON inbound_packages;
create trigger trg_inbound_packages_set_updated_at
before update on inbound_packages
for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_customer_shipments_set_updated_at ON customer_shipments;
create trigger trg_customer_shipments_set_updated_at
before update on customer_shipments
for each row execute function set_updated_at();

insert into hubs (code, name, city, province)
values
    ('JKT', 'Hub Jakarta', 'Jakarta', 'DKI Jakarta'),
    ('SUB', 'Hub Surabaya', 'Surabaya', 'Jawa Timur'),
    ('MKS', 'Hub Makassar', 'Makassar', 'Sulawesi Selatan')
on conflict (code) do nothing;
