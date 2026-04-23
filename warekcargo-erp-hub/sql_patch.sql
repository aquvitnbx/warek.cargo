BEGIN;

-- 1. Geser sort_order ref_shipment_statuses ke bawah (dari DISPATCHED ke bawah)
UPDATE ref_shipment_statuses SET sort_order = sort_order + 1 WHERE sort_order >= 4;

-- Sisipkan MANIFESTED di posisi 4
INSERT INTO ref_shipment_statuses (code, name, description, sort_order)
VALUES ('MANIFESTED', 'Manifested / Assigned', 'Shipment has been assigned to a transport batch but has not departed yet', 4)
ON CONFLICT (code) DO NOTHING;

-- 2. Geser sort_order ref_package_statuses ke bawah (dari SHIPPED ke bawah)
-- READY_FOR_BATCH adalah 7, SHIPPED adalah 8. Kita taruh MANIFESTED di 8 dan geser SHIPPED dkk ke atas.
UPDATE ref_package_statuses SET sort_order = sort_order + 1 WHERE sort_order >= 8;

INSERT INTO ref_package_statuses (code, name, description, sort_order)
VALUES ('MANIFESTED', 'Manifested / Assigned to Vessel', 'Package is part of a shipment that has been assigned to a vessel/container, awaiting departure', 8)
ON CONFLICT (code) DO NOTHING;

COMMIT;
