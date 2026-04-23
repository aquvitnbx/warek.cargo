BEGIN;
UPDATE customer_shipments SET shipment_status_code = 'READY_FOR_DISPATCH', batch_id = NULL, batch_container_id = NULL WHERE id = 'd604e2de-50d5-4521-af48-e32fb847e0f4';
DELETE FROM shipment_status_history WHERE shipment_id = 'd604e2de-50d5-4521-af48-e32fb847e0f4' AND to_status_code IN ('MANIFESTED', 'DISPATCHED');
COMMIT;
