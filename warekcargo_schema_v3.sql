-- WarekCargo PostgreSQL Schema v3
-- Master-data-driven operational schema.

create extension if not exists pgcrypto;

-- ============================================================
-- MASTER / REFERENCE TABLES
-- ============================================================

create table if not exists ref_service_types (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_transport_modes (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_package_statuses (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_batch_statuses (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_shipment_statuses (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_payment_statuses (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_payment_methods (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_pickup_delivery_statuses (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_issue_scopes (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_issue_statuses (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_issue_types (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_photo_types (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_notification_channels (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_marketplaces (
    code text primary key,
    name text not null,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists ref_ports (
    code text primary key,
    name text not null,
    city text,
    province text,
    description text,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ============================================================
-- CORE OPERATIONAL TABLES
-- ============================================================

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
    origin_port_code text references ref_ports(code),
    destination_port_code text references ref_ports(code),
    destination_city text not null default 'Nabire',
    service_type_code text not null references ref_service_types(code),
    transport_mode_code text not null references ref_transport_modes(code),
    vessel_name text,
    voyage_number text,
    container_number text,
    assigned_admin text,
    batch_status_code text not null references ref_batch_statuses(code),
    closing_at timestamptz not null,
    etd_at timestamptz not null,
    eta_at timestamptz,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists customer_batch_interests (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references customers(id) on delete cascade,
    batch_id uuid not null references shipping_batches(id) on delete cascade,
    service_type_code text not null references ref_service_types(code),
    interest_status_code text not null check (interest_status_code in ('INTERESTED', 'CONFIRMED', 'CANCELLED', 'MOVED_TO_NEXT_BATCH')),
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
    marketplace_code text references ref_marketplaces(code),
    item_description text,
    quantity integer not null default 1 check (quantity > 0),
    estimated_weight_kg numeric(10,2),
    estimated_volume_m3 numeric(10,4),
    actual_weight_kg numeric(10,2),
    actual_volume_m3 numeric(10,4),
    package_status_code text not null references ref_package_statuses(code),
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

-- =====================================================================
-- 6.5. Pricing Rates / Tariff Master
-- =====================================================================
create table if not exists master_pricing_rates (
    id uuid primary key default gen_random_uuid(),
    origin_hub_id uuid not null,
    destination_city text not null,
    service_type_code text not null,
    price_per_kg numeric(14,2) not null default 0,
    price_per_m3 numeric(14,2) not null default 0,
    min_weight_kg numeric(10,2) not null default 0,
    min_volume_m3 numeric(10,4) not null default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(origin_hub_id, destination_city, service_type_code)
);

create index if not exists idx_master_pricing_rates_origin_dest on master_pricing_rates(origin_hub_id, destination_city, service_type_code);


create table if not exists inbound_package_status_history (
    id uuid primary key default gen_random_uuid(),
    inbound_package_id uuid not null references inbound_packages(id) on delete cascade,
    from_status_code text references ref_package_statuses(code),
    to_status_code text not null references ref_package_statuses(code),
    changed_by text,
    changed_source text,
    change_notes text,
    changed_at timestamptz not null default now()
);

create table if not exists package_photos (
    id uuid primary key default gen_random_uuid(),
    inbound_package_id uuid not null references inbound_packages(id) on delete cascade,
    photo_type_code text not null references ref_photo_types(code),
    file_path text not null,
    original_filename text,
    mime_type text,
    uploaded_by text,
    uploaded_at timestamptz not null default now()
);

create table if not exists customer_shipments (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references customers(id),
    batch_id uuid references shipping_batches(id),
    shipment_code text not null unique,
    service_type_code text not null references ref_service_types(code),
    container_number text,
    vessel_name text,
    voyage_number text,
    total_weight_kg numeric(10,2),
    total_volume_m3 numeric(10,4),
    final_charge_amount numeric(14,2),
    amount_paid numeric(14,2) not null default 0,
    payment_method_code text references ref_payment_methods(code),
    payment_status_code text not null references ref_payment_statuses(code),
    payment_due_at timestamptz,
    shipment_status_code text not null references ref_shipment_statuses(code),
    requires_last_mile boolean not null default false,
    last_mile_fee numeric(14,2),
    pickup_delivery_status_code text not null references ref_pickup_delivery_statuses(code),
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
    from_status_code text references ref_shipment_statuses(code),
    to_status_code text not null references ref_shipment_statuses(code),
    changed_by text,
    changed_source text,
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
    payment_method_code text not null references ref_payment_methods(code),
    amount numeric(14,2) not null check (amount >= 0),
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
    issue_scope_code text not null references ref_issue_scopes(code),
    issue_type_code text not null references ref_issue_types(code),
    issue_status_code text not null references ref_issue_statuses(code),
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
    notification_channel_code text not null references ref_notification_channels(code),
    notification_type text not null,
    message_content text not null,
    provider_message_id text,
    retry_count integer not null default 0,
    error_reason text,
    delivery_status_code text not null check (delivery_status_code in ('QUEUED', 'SENT', 'FAILED', 'CANCELLED')),
    sent_at timestamptz,
    created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_customers_customer_code on customers(customer_code);
create index if not exists idx_inbound_packages_customer_id on inbound_packages(customer_id);
create index if not exists idx_inbound_packages_hub_id on inbound_packages(hub_id);
create index if not exists idx_inbound_packages_target_batch_id on inbound_packages(target_batch_id);
create index if not exists idx_inbound_packages_status_code on inbound_packages(package_status_code);
create index if not exists idx_inbound_package_status_history_package_id on inbound_package_status_history(inbound_package_id);
create index if not exists idx_shipping_batches_hub_id on shipping_batches(hub_id);
create index if not exists idx_shipping_batches_status_code on shipping_batches(batch_status_code);
create index if not exists idx_customer_shipments_customer_id on customer_shipments(customer_id);
create index if not exists idx_customer_shipments_batch_id on customer_shipments(batch_id);
create index if not exists idx_customer_shipments_payment_status_code on customer_shipments(payment_status_code);
create index if not exists idx_customer_shipments_pickup_delivery_status_code on customer_shipments(pickup_delivery_status_code);
create index if not exists idx_shipment_status_history_shipment_id on shipment_status_history(shipment_id);
create index if not exists idx_shipment_payments_shipment_id on shipment_payments(shipment_id);
create index if not exists idx_shipment_payment_proofs_shipment_id on shipment_payment_proofs(shipment_id);
create index if not exists idx_shipment_payment_proofs_payment_id on shipment_payment_proofs(shipment_payment_id);
create index if not exists idx_operational_issues_scope_status on operational_issues(issue_scope_code, issue_status_code);
create index if not exists idx_notifications_log_customer_id on notifications_log(customer_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

DROP TRIGGER IF EXISTS trg_customers_set_updated_at ON customers;
create trigger trg_customers_set_updated_at before update on customers for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_hubs_set_updated_at ON hubs;
create trigger trg_hubs_set_updated_at before update on hubs for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_shipping_batches_set_updated_at ON shipping_batches;
create trigger trg_shipping_batches_set_updated_at before update on shipping_batches for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_inbound_packages_set_updated_at ON inbound_packages;
create trigger trg_inbound_packages_set_updated_at before update on inbound_packages for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_customer_shipments_set_updated_at ON customer_shipments;
create trigger trg_customer_shipments_set_updated_at before update on customer_shipments for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_service_types_set_updated_at ON ref_service_types;
create trigger trg_ref_service_types_set_updated_at before update on ref_service_types for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_transport_modes_set_updated_at ON ref_transport_modes;
create trigger trg_ref_transport_modes_set_updated_at before update on ref_transport_modes for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_package_statuses_set_updated_at ON ref_package_statuses;
create trigger trg_ref_package_statuses_set_updated_at before update on ref_package_statuses for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_batch_statuses_set_updated_at ON ref_batch_statuses;
create trigger trg_ref_batch_statuses_set_updated_at before update on ref_batch_statuses for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_shipment_statuses_set_updated_at ON ref_shipment_statuses;
create trigger trg_ref_shipment_statuses_set_updated_at before update on ref_shipment_statuses for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_payment_statuses_set_updated_at ON ref_payment_statuses;
create trigger trg_ref_payment_statuses_set_updated_at before update on ref_payment_statuses for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_payment_methods_set_updated_at ON ref_payment_methods;
create trigger trg_ref_payment_methods_set_updated_at before update on ref_payment_methods for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_pickup_delivery_statuses_set_updated_at ON ref_pickup_delivery_statuses;
create trigger trg_ref_pickup_delivery_statuses_set_updated_at before update on ref_pickup_delivery_statuses for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_issue_scopes_set_updated_at ON ref_issue_scopes;
create trigger trg_ref_issue_scopes_set_updated_at before update on ref_issue_scopes for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_issue_statuses_set_updated_at ON ref_issue_statuses;
create trigger trg_ref_issue_statuses_set_updated_at before update on ref_issue_statuses for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_issue_types_set_updated_at ON ref_issue_types;
create trigger trg_ref_issue_types_set_updated_at before update on ref_issue_types for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_photo_types_set_updated_at ON ref_photo_types;
create trigger trg_ref_photo_types_set_updated_at before update on ref_photo_types for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_notification_channels_set_updated_at ON ref_notification_channels;
create trigger trg_ref_notification_channels_set_updated_at before update on ref_notification_channels for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_marketplaces_set_updated_at ON ref_marketplaces;
create trigger trg_ref_marketplaces_set_updated_at before update on ref_marketplaces for each row execute function set_updated_at();

DROP TRIGGER IF EXISTS trg_ref_ports_set_updated_at ON ref_ports;
create trigger trg_ref_ports_set_updated_at before update on ref_ports for each row execute function set_updated_at();

-- ============================================================
-- SEED MASTER DATA
-- ============================================================

insert into ref_service_types (code, name, sort_order) values
('HEMAT', 'Hemat', 1),
('CEPAT', 'Cepat', 2),
('EXPRESS', 'Express', 3)
on conflict (code) do nothing;

insert into ref_transport_modes (code, name, sort_order) values
('KAPAL_KARGO', 'Kapal Kargo', 1),
('KAPAL_PENUMPANG', 'Kapal Penumpang', 2),
('PESAWAT', 'Pesawat', 3)
on conflict (code) do nothing;

insert into ref_package_statuses (code, name, sort_order) values
('REGISTERED', 'Registered', 1),
('IN_TRANSIT_TO_HUB', 'In Transit to Hub', 2),
('RECEIVED_AT_HUB', 'Received at Hub', 3),
('DAMAGED', 'Damaged', 4),
('UNIDENTIFIED', 'Unidentified', 5),
('REPACKING', 'Repacking', 6),
('READY_FOR_BATCH', 'Ready for Batch', 7),
('SHIPPED', 'Shipped', 8),
('ARRIVED_DESTINATION', 'Arrived Destination', 9),
('DELIVERED', 'Delivered', 10),
('CANCELLED', 'Cancelled', 11)
on conflict (code) do nothing;

insert into ref_batch_statuses (code, name, sort_order) values
('PLANNED', 'Planned', 1),
('OPEN', 'Open', 2),
('CLOSED', 'Closed', 3),
('DEPARTED', 'Departed', 4),
('ARRIVED', 'Arrived', 5),
('COMPLETED', 'Completed', 6),
('CANCELLED', 'Cancelled', 7)
on conflict (code) do nothing;

insert into ref_shipment_statuses (code, name, sort_order) values
('DRAFT', 'Draft', 1),
('AWAITING_PACKAGES', 'Awaiting Packages', 2),
('READY_FOR_DISPATCH', 'Ready for Dispatch', 3),
('DISPATCHED', 'Dispatched', 4),
('ARRIVED_DESTINATION', 'Arrived at Destination Hub', 5),
('READY_FOR_PICKUP', 'Ready for Pickup', 6),
('OUT_FOR_DELIVERY', 'Out for Delivery', 7),
('COMPLETED', 'Completed', 8),
('CANCELLED', 'Cancelled', 9)
on conflict (code) do nothing;

insert into ref_payment_statuses (code, name, sort_order) values
('PENDING', 'Pending', 1),
('PARTIAL', 'Partial', 2),
('PAID', 'Paid', 3),
('CANCELLED', 'Cancelled', 4)
on conflict (code) do nothing;

insert into ref_payment_methods (code, name, sort_order) values
('PAY_ON_PICKUP', 'Pay on Pickup', 1),
('BANK_TRANSFER', 'Bank Transfer', 2),
('CASH', 'Cash', 3),
('OTHER', 'Other', 4)
on conflict (code) do nothing;

insert into ref_pickup_delivery_statuses (code, name, sort_order) values
('NOT_READY', 'Not Ready', 1),
('READY_FOR_PICKUP', 'Ready for Pickup', 2),
('PICKED_UP', 'Picked Up', 3),
('OUT_FOR_DELIVERY', 'Out for Delivery', 4),
('DELIVERED', 'Delivered', 5)
on conflict (code) do nothing;

insert into ref_issue_scopes (code, name, sort_order) values
('PACKAGE', 'Package', 1),
('SHIPMENT', 'Shipment', 2),
('BATCH', 'Batch', 3),
('PAYMENT', 'Payment', 4),
('CUSTOMER', 'Customer', 5)
on conflict (code) do nothing;

insert into ref_issue_statuses (code, name, sort_order) values
('OPEN', 'Open', 1),
('INVESTIGATING', 'Investigating', 2),
('RESOLVED', 'Resolved', 3),
('CANCELLED', 'Cancelled', 4)
on conflict (code) do nothing;

insert into ref_issue_types (code, name, sort_order) values
('DELAY', 'Delay', 1),
('DAMAGE', 'Damage', 2),
('MISSING_LABEL', 'Missing Label', 3),
('PAYMENT_PROBLEM', 'Payment Problem', 4),
('CUSTOMER_COMPLAINT', 'Customer Complaint', 5),
('WRONG_HUB', 'Wrong Hub', 6),
('UNIDENTIFIED_PACKAGE', 'Unidentified Package', 7)
on conflict (code) do nothing;

insert into ref_photo_types (code, name, sort_order) values
('PACKAGE', 'Package', 1),
('LABEL', 'Label', 2),
('DAMAGE', 'Damage', 3),
('OTHER', 'Other', 4)
on conflict (code) do nothing;

insert into ref_notification_channels (code, name, sort_order) values
('WHATSAPP', 'WhatsApp', 1),
('TELEGRAM', 'Telegram', 2),
('INSTAGRAM', 'Instagram', 3),
('MANUAL', 'Manual', 4)
on conflict (code) do nothing;

insert into ref_marketplaces (code, name, sort_order) values
('SHOPEE', 'Shopee', 1),
('TOKOPEDIA', 'Tokopedia', 2),
('TIKTOK_SHOP', 'TikTok Shop', 3),
('BLIBLI', 'Blibli', 4),
('OTHER', 'Other', 5)
on conflict (code) do nothing;

insert into ref_ports (code, name, city, province, sort_order) values
('TANJUNG_PRIOK', 'Tanjung Priok', 'Jakarta', 'DKI Jakarta', 1),
('TANJUNG_PERAK', 'Tanjung Perak', 'Surabaya', 'Jawa Timur', 2),
('NABIRE_PORT', 'Pelabuhan Nabire', 'Nabire', 'Papua Tengah', 3),
('SORONG_PORT', 'Pelabuhan Sorong', 'Sorong', 'Papua Barat Daya', 4),
('MANOKWARI_PORT', 'Pelabuhan Manokwari', 'Manokwari', 'Papua Barat', 5)
on conflict (code) do nothing;

insert into hubs (code, name, city, province)
values
    ('JKT', 'Hub Jakarta', 'Jakarta', 'DKI Jakarta'),
    ('SUB', 'Hub Surabaya', 'Surabaya', 'Jawa Timur'),
    ('MKS', 'Hub Makassar', 'Makassar', 'Sulawesi Selatan')
on conflict (code) do nothing;
