-- WarekCargo sample scenarios for schema v2
-- Scenario 1: review of current sample fields that may still need improvement
-- Scenario 2: pay on pickup / pay when goods are collected
-- Scenario 3: incomplete package set, customer agrees to move missing package to next batch

-- ============================================================
-- SCENARIO 1
-- REVIEW NOTES AS SQL COMMENTS FOR FUTURE SCHEMA IMPROVEMENT
-- ============================================================

-- 1. Consider adding a table for shipment_status_history so every important status change
--    is logged with time, actor, and notes.
-- 2. Consider adding a table for inbound_package_status_history for better auditability.
-- 3. Consider adding actual_weight_kg and actual_volume_m3 at package level after hub intake.
-- 4. Consider adding a customer payment transaction table if later customer may pay in multiple installments.
-- 5. Consider adding assigned_admin or assigned_team fields for operational responsibility.
-- 6. Consider adding a delivery_address_override on shipment level in case shipment address differs
--    from the main customer profile.
-- 7. Consider adding an issue_flags or exception table for damaged, unidentified, or delayed packages.

-- ============================================================
-- SCENARIO 2
-- CUSTOMER PAYS WHEN GOODS ARE COLLECTED IN NABIRE
-- ============================================================

-- Customer
insert into customers (
    customer_code,
    full_name,
    whatsapp_number,
    destination_city,
    destination_district,
    address,
    notes
) values (
    'CUST-NAB-0002',
    'Markus Ayomi',
    '6282234567891',
    'Nabire',
    'Kalibobo',
    'Jl. Sam Ratulangi, Nabire',
    'Pelanggan memilih bayar saat ambil barang'
);

-- Batch from Surabaya to Nabire using cargo ship (hemat)
insert into shipping_batches (
    batch_code,
    hub_id,
    origin_port,
    destination_port,
    destination_city,
    service_type,
    transport_mode,
    vessel_name,
    voyage_number,
    container_number,
    closing_at,
    etd_at,
    eta_at,
    status,
    notes
)
select
    'SUB-NAB-2026-04-24-CARGO-01',
    h.id,
    'Tanjung Perak',
    'Nabire',
    'Nabire',
    'hemat',
    'kapal_kargo',
    'KM Cargo Sejahtera',
    '01.2026',
    'CONT-SUB-7788',
    '2026-04-23 17:00:00+07',
    '2026-04-24 21:00:00+07',
    '2026-05-06 09:00:00+09',
    'open',
    'Batch kapal kargo hemat Surabaya ke Nabire'
from hubs h
where h.code = 'SUB';

-- Customer interest
insert into customer_batch_interests (
    customer_id,
    batch_id,
    selected_service_type,
    status,
    notes
)
select
    c.id,
    b.id,
    'hemat',
    'confirmed',
    'Customer memilih hemat dan setuju bayar saat ambil barang'
from customers c
join shipping_batches b on b.batch_code = 'SUB-NAB-2026-04-24-CARGO-01'
where c.customer_code = 'CUST-NAB-0002';

-- Inbound packages
insert into inbound_packages (
    package_ticket_code,
    customer_id,
    hub_id,
    target_batch_id,
    tracking_number,
    sender_or_store,
    marketplace_name,
    item_description,
    quantity,
    estimated_weight_kg,
    package_status,
    is_cod,
    customer_declared_at,
    received_at,
    admin_notes
)
select
    'PKG-SUB-1001',
    c.id,
    h.id,
    b.id,
    'SP200000001ID',
    'Elektronik Murah',
    'Tokopedia',
    'Speaker bluetooth',
    1,
    2.00,
    'received_at_hub',
    false,
    '2026-04-20 13:00:00+07',
    '2026-04-21 10:15:00+07',
    'Paket diterima baik di hub Surabaya'
from customers c
join hubs h on h.code = 'SUB'
join shipping_batches b on b.batch_code = 'SUB-NAB-2026-04-24-CARGO-01'
where c.customer_code = 'CUST-NAB-0002';

insert into inbound_packages (
    package_ticket_code,
    customer_id,
    hub_id,
    target_batch_id,
    tracking_number,
    sender_or_store,
    marketplace_name,
    item_description,
    quantity,
    estimated_weight_kg,
    package_status,
    is_cod,
    customer_declared_at,
    received_at,
    admin_notes
)
select
    'PKG-SUB-1002',
    c.id,
    h.id,
    b.id,
    'SP200000002ID',
    'Toko Dapur',
    'Shopee',
    'Set alat masak',
    1,
    3.50,
    'received_at_hub',
    false,
    '2026-04-20 13:20:00+07',
    '2026-04-21 15:45:00+07',
    'Paket diterima dan siap digabung'
from customers c
join hubs h on h.code = 'SUB'
join shipping_batches b on b.batch_code = 'SUB-NAB-2026-04-24-CARGO-01'
where c.customer_code = 'CUST-NAB-0002';

-- Shipment final, not yet paid because payment will happen on pickup
insert into customer_shipments (
    customer_id,
    batch_id,
    shipment_code,
    final_service_type,
    container_number,
    vessel_name,
    voyage_number,
    total_weight_kg,
    total_volume_m3,
    final_charge_amount,
    amount_paid,
    payment_method,
    payment_status,
    payment_due_at,
    shipment_status,
    requires_last_mile,
    last_mile_fee,
    pickup_or_delivery_status,
    notes
)
select
    c.id,
    b.id,
    'SHP-NAB-2026-0002',
    'hemat',
    'CONT-SUB-7788',
    'KM Cargo Sejahtera',
    '01.2026',
    5.50,
    0.0450,
    66000,
    0,
    'pay_on_pickup',
    'pending',
    '2026-05-07 17:00:00+09',
    'arrived_nabire',
    false,
    null,
    'ready_for_pickup',
    'Customer akan membayar saat datang mengambil barang di agen Nabire'
from customers c
join shipping_batches b on b.batch_code = 'SUB-NAB-2026-04-24-CARGO-01'
where c.customer_code = 'CUST-NAB-0002';

-- Link packages
insert into shipment_packages (shipment_id, inbound_package_id)
select s.id, p.id
from customer_shipments s
join customers c on c.id = s.customer_id
join inbound_packages p on p.customer_id = c.id
where s.shipment_code = 'SHP-NAB-2026-0002'
  and p.package_ticket_code in ('PKG-SUB-1001', 'PKG-SUB-1002');

-- Notification: goods ready for pickup and payment due on pickup
insert into notifications_log (
    customer_id,
    shipment_id,
    batch_id,
    channel,
    notification_type,
    message_content,
    delivery_status,
    sent_at
)
select
    c.id,
    s.id,
    b.id,
    'whatsapp',
    'ready_for_pickup_notice',
    'Shipment SHP-NAB-2026-0002 sudah tiba di Nabire dan siap diambil. Total pembayaran Rp66.000 dibayarkan saat pengambilan.',
    'sent',
    '2026-05-07 09:00:00+09'
from customers c
join customer_shipments s on s.customer_id = c.id
join shipping_batches b on b.id = s.batch_id
where s.shipment_code = 'SHP-NAB-2026-0002';

-- ============================================================
-- SCENARIO 3
-- MISSING PACKAGE MOVED TO NEXT BATCH
-- ============================================================

-- Customer
insert into customers (
    customer_code,
    full_name,
    whatsapp_number,
    destination_city,
    destination_district,
    address,
    notes
) values (
    'CUST-NAB-0003',
    'Maria Yarangga',
    '6282334567892',
    'Nabire',
    'Karang Mulia',
    'Jl. Frans Kaisepo, Nabire',
    'Sering memiliki beberapa paket dari seller berbeda'
);

-- First batch from Jakarta
insert into shipping_batches (
    batch_code,
    hub_id,
    origin_port,
    destination_port,
    destination_city,
    service_type,
    transport_mode,
    vessel_name,
    voyage_number,
    container_number,
    closing_at,
    etd_at,
    eta_at,
    status,
    notes
)
select
    'JKT-NAB-2026-04-26-GNDEMPO-09',
    h.id,
    'Tanjung Priok',
    'Nabire',
    'Nabire',
    'cepat',
    'kapal_penumpang',
    'GN. DEMPO',
    '09.2026',
    null,
    '2026-04-25 17:00:00+07',
    '2026-04-26 09:00:00+07',
    '2026-05-03 13:00:00+09',
    'open',
    'Batch penumpang untuk customer yang perlu pengiriman cepat'
from hubs h
where h.code = 'JKT';

-- Next batch from Jakarta
insert into shipping_batches (
    batch_code,
    hub_id,
    origin_port,
    destination_port,
    destination_city,
    service_type,
    transport_mode,
    vessel_name,
    voyage_number,
    container_number,
    closing_at,
    etd_at,
    eta_at,
    status,
    notes
)
select
    'JKT-NAB-2026-05-03-GNDEMPO-10',
    h.id,
    'Tanjung Priok',
    'Nabire',
    'Nabire',
    'cepat',
    'kapal_penumpang',
    'GN. DEMPO',
    '10.2026',
    null,
    '2026-05-02 17:00:00+07',
    '2026-05-03 09:00:00+07',
    '2026-05-10 13:00:00+09',
    'planned',
    'Batch berikutnya untuk paket yang tertinggal'
from hubs h
where h.code = 'JKT';

-- Initial interest in first batch
insert into customer_batch_interests (
    customer_id,
    batch_id,
    selected_service_type,
    status,
    notes
)
select
    c.id,
    b.id,
    'cepat',
    'confirmed',
    'Customer awalnya ingin semua paket ikut batch pertama'
from customers c
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-26-GNDEMPO-09'
where c.customer_code = 'CUST-NAB-0003';

-- Three package declarations, one missing package still not received at hub
insert into inbound_packages (
    package_ticket_code,
    customer_id,
    hub_id,
    target_batch_id,
    tracking_number,
    sender_or_store,
    marketplace_name,
    item_description,
    quantity,
    estimated_weight_kg,
    package_status,
    is_cod,
    customer_declared_at,
    received_at,
    admin_notes
)
select
    'PKG-JKT-2001',
    c.id,
    h.id,
    b.id,
    'JK300000001ID',
    'Toko Baju',
    'Shopee',
    'Baju wanita',
    1,
    0.70,
    'received_at_hub',
    false,
    '2026-04-21 10:00:00+07',
    '2026-04-23 09:00:00+07',
    'Paket pertama sudah tiba'
from customers c
join hubs h on h.code = 'JKT'
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-26-GNDEMPO-09'
where c.customer_code = 'CUST-NAB-0003';

insert into inbound_packages (
    package_ticket_code,
    customer_id,
    hub_id,
    target_batch_id,
    tracking_number,
    sender_or_store,
    marketplace_name,
    item_description,
    quantity,
    estimated_weight_kg,
    package_status,
    is_cod,
    customer_declared_at,
    received_at,
    admin_notes
)
select
    'PKG-JKT-2002',
    c.id,
    h.id,
    b.id,
    'JK300000002ID',
    'Toko Sandal',
    'Tokopedia',
    'Sandal wanita',
    1,
    0.60,
    'received_at_hub',
    false,
    '2026-04-21 10:10:00+07',
    '2026-04-24 14:00:00+07',
    'Paket kedua sudah tiba'
from customers c
join hubs h on h.code = 'JKT'
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-26-GNDEMPO-09'
where c.customer_code = 'CUST-NAB-0003';

insert into inbound_packages (
    package_ticket_code,
    customer_id,
    hub_id,
    target_batch_id,
    tracking_number,
    sender_or_store,
    marketplace_name,
    item_description,
    quantity,
    estimated_weight_kg,
    package_status,
    is_cod,
    customer_declared_at,
    admin_notes
)
select
    'PKG-JKT-2003',
    c.id,
    h.id,
    b.id,
    'JK300000003ID',
    'Toko Aksesoris',
    'Shopee',
    'Aksesoris rambut',
    1,
    0.20,
    'in_transit_to_hub',
    false,
    '2026-04-21 10:20:00+07',
    'Paket ketiga belum tiba sebelum closing batch pertama'
from customers c
join hubs h on h.code = 'JKT'
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-26-GNDEMPO-09'
where c.customer_code = 'CUST-NAB-0003';

-- Shipment for packages that are already complete enough to depart now
insert into customer_shipments (
    customer_id,
    batch_id,
    shipment_code,
    final_service_type,
    container_number,
    vessel_name,
    voyage_number,
    total_weight_kg,
    total_volume_m3,
    final_charge_amount,
    amount_paid,
    payment_method,
    payment_status,
    payment_due_at,
    shipment_status,
    requires_last_mile,
    last_mile_fee,
    pickup_or_delivery_status,
    notes
)
select
    c.id,
    b.id,
    'SHP-NAB-2026-0003',
    'cepat',
    null,
    'GN. DEMPO',
    '09.2026',
    1.30,
    0.0100,
    22000,
    22000,
    'bank_transfer',
    'paid',
    '2026-04-25 20:00:00+09',
    'ready_for_dispatch',
    false,
    null,
    'not_ready',
    'Dua paket dikirim dulu setelah customer setuju paket ketiga ikut batch berikutnya'
from customers c
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-26-GNDEMPO-09'
where c.customer_code = 'CUST-NAB-0003';

-- Link first two packages to first shipment
insert into shipment_packages (shipment_id, inbound_package_id)
select s.id, p.id
from customer_shipments s
join customers c on c.id = s.customer_id
join inbound_packages p on p.customer_id = c.id
where s.shipment_code = 'SHP-NAB-2026-0003'
  and p.package_ticket_code in ('PKG-JKT-2001', 'PKG-JKT-2002');

-- Update customer interest for first batch as moved, then create next batch interest
update customer_batch_interests
set status = 'moved_to_next_batch',
    notes = 'Satu paket belum tiba, customer setuju paket sisanya ikut batch berikutnya'
where customer_id = (select id from customers where customer_code = 'CUST-NAB-0003')
  and batch_id = (select id from shipping_batches where batch_code = 'JKT-NAB-2026-04-26-GNDEMPO-09');

insert into customer_batch_interests (
    customer_id,
    batch_id,
    selected_service_type,
    status,
    notes
)
select
    c.id,
    b.id,
    'cepat',
    'confirmed',
    'Paket ketiga dipindahkan ke batch berikutnya atas persetujuan customer'
from customers c
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-05-03-GNDEMPO-10'
where c.customer_code = 'CUST-NAB-0003';

-- Retarget the missing package to next batch
update inbound_packages
set target_batch_id = (select id from shipping_batches where batch_code = 'JKT-NAB-2026-05-03-GNDEMPO-10'),
    admin_notes = 'Dipindahkan ke batch berikutnya karena belum tiba sebelum closing'
where package_ticket_code = 'PKG-JKT-2003';

-- Notification: confirm split shipment and moved package
insert into notifications_log (
    customer_id,
    batch_id,
    channel,
    notification_type,
    message_content,
    delivery_status,
    sent_at
)
select
    c.id,
    b.id,
    'whatsapp',
    'split_shipment_confirmation',
    'Dua paket Anda akan dikirim dengan batch GN. DEMPO voyage 09.2026. Satu paket yang belum tiba dipindahkan ke batch berikutnya setelah Anda setujui.',
    'sent',
    '2026-04-25 11:30:00+09'
from customers c
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-26-GNDEMPO-09'
where c.customer_code = 'CUST-NAB-0003';
