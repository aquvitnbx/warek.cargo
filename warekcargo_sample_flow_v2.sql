-- WarekCargo sample end-to-end flow for schema v2
-- Scenario:
-- 1 customer in Nabire
-- 1 Jakarta batch via KM Gunung Dempo
-- 3 inbound packages from different sellers
-- packages consolidated into 1 shipment
-- customer pays by bank transfer and uploads payment proof

-- 1. Customer
insert into customers (
    customer_code,
    full_name,
    whatsapp_number,
    destination_city,
    destination_district,
    address,
    notes
) values (
    'CUST-NAB-0001',
    'Yuliana Wonda',
    '6281234567890',
    'Nabire',
    'Nabire Kota',
    'Jl. Merdeka, Nabire',
    'Customer aktif dan sering belanja dari marketplace'
);

-- 2. Batch Jakarta -> Nabire via kapal penumpang
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
    'JKT-NAB-2026-04-19-GNDEMPO-08',
    h.id,
    'Tanjung Priok',
    'Nabire',
    'Nabire',
    'cepat',
    'kapal_penumpang',
    'GN. DEMPO',
    '08.2026',
    null,
    '2026-04-18 17:00:00+07',
    '2026-04-19 10:00:00+07',
    '2026-04-26 13:00:00+09',
    'open',
    'Jadwal Pelni Jakarta ke Nabire untuk customer batch pertengahan April'
from hubs h
where h.code = 'JKT';

-- 3. Customer interest in batch
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
    'Customer memilih ikut kapal penumpang karena ingin lebih cepat'
from customers c
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-19-GNDEMPO-08'
where c.customer_code = 'CUST-NAB-0001';

-- 4. Inbound packages declared by customer
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
    'PKG-JKT-0001',
    c.id,
    h.id,
    b.id,
    'JP100000001ID',
    'Toko Sepatu Jakarta',
    'Shopee',
    'Sepatu olahraga wanita',
    1,
    1.20,
    'in_transit_to_hub',
    false,
    '2026-04-14 09:00:00+07',
    'Dideklarasikan customer ke Nala'
from customers c
join hubs h on h.code = 'JKT'
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-19-GNDEMPO-08'
where c.customer_code = 'CUST-NAB-0001';

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
    'PKG-JKT-0002',
    c.id,
    h.id,
    b.id,
    'JP100000002ID',
    'Official Store Tas',
    'Tokopedia',
    'Tas kerja wanita',
    1,
    0.80,
    'received_at_hub',
    false,
    '2026-04-14 09:10:00+07',
    'Paket sudah diterima lebih dulu di hub'
from customers c
join hubs h on h.code = 'JKT'
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-19-GNDEMPO-08'
where c.customer_code = 'CUST-NAB-0001';

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
    'PKG-JKT-0003',
    c.id,
    h.id,
    b.id,
    'JP100000003ID',
    'Toko Skincare',
    'Shopee',
    'Paket skincare',
    1,
    1.50,
    'received_at_hub',
    false,
    '2026-04-14 09:20:00+07',
    'Paket sudah diterima di hub dan menunggu paket lain lengkap'
from customers c
join hubs h on h.code = 'JKT'
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-19-GNDEMPO-08'
where c.customer_code = 'CUST-NAB-0001';

-- 5. Package photos stored in VPS paths
insert into package_photos (
    inbound_package_id,
    photo_type,
    file_path,
    original_filename,
    mime_type,
    uploaded_by
)
select
    p.id,
    'package',
    '/var/lib/warekcargo/uploads/packages/2026/04/15/pkg-jkt-0002-package.jpg',
    'pkg-jkt-0002-package.jpg',
    'image/jpeg',
    'admin_hub_jakarta'
from inbound_packages p
where p.package_ticket_code = 'PKG-JKT-0002';

insert into package_photos (
    inbound_package_id,
    photo_type,
    file_path,
    original_filename,
    mime_type,
    uploaded_by
)
select
    p.id,
    'label',
    '/var/lib/warekcargo/uploads/packages/2026/04/15/pkg-jkt-0002-label.jpg',
    'pkg-jkt-0002-label.jpg',
    'image/jpeg',
    'admin_hub_jakarta'
from inbound_packages p
where p.package_ticket_code = 'PKG-JKT-0002';

-- 6. Final consolidated shipment after repacking
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
    'SHP-NAB-2026-0001',
    'cepat',
    null,
    'GN. DEMPO',
    '08.2026',
    3.80,
    0.0200,
    68000,
    68000,
    'bank_transfer',
    'paid',
    '2026-04-18 20:00:00+09',
    'ready_for_dispatch',
    true,
    15000,
    'not_ready',
    'Tiga paket digabung menjadi satu shipment final ke Nabire'
from customers c
join shipping_batches b on b.batch_code = 'JKT-NAB-2026-04-19-GNDEMPO-08'
where c.customer_code = 'CUST-NAB-0001';

-- 7. Link packages into final shipment
insert into shipment_packages (shipment_id, inbound_package_id)
select s.id, p.id
from customer_shipments s
join customers c on c.id = s.customer_id
join inbound_packages p on p.customer_id = c.id
where s.shipment_code = 'SHP-NAB-2026-0001'
  and p.package_ticket_code in ('PKG-JKT-0001', 'PKG-JKT-0002', 'PKG-JKT-0003');

-- 8. Payment proof stored in VPS path
insert into shipment_payment_proofs (
    shipment_id,
    file_path,
    original_filename,
    mime_type,
    uploaded_by,
    notes
)
select
    s.id,
    '/var/lib/warekcargo/uploads/payments/2026/04/18/shp-nab-2026-0001-transfer.jpg',
    'shp-nab-2026-0001-transfer.jpg',
    'image/jpeg',
    'customer_whatsapp',
    'Bukti transfer pelunasan ongkir final'
from customer_shipments s
where s.shipment_code = 'SHP-NAB-2026-0001';

-- 9. Notification logs
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
    'final_charge_notice',
    'Total ongkir final shipment SHP-NAB-2026-0001 adalah Rp68.000. Silakan lakukan pembayaran agar barang bisa diproses ke batch keberangkatan.',
    'sent',
    '2026-04-18 11:00:00+09'
from customers c
join customer_shipments s on s.customer_id = c.id
join shipping_batches b on b.id = s.batch_id
where s.shipment_code = 'SHP-NAB-2026-0001';

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
    'payment_confirmation',
    'Pembayaran untuk shipment SHP-NAB-2026-0001 sudah diterima. Barang dijadwalkan masuk batch GN. DEMPO voyage 08.2026.',
    'sent',
    '2026-04-18 12:00:00+09'
from customers c
join customer_shipments s on s.customer_id = c.id
join shipping_batches b on b.id = s.batch_id
where s.shipment_code = 'SHP-NAB-2026-0001';
