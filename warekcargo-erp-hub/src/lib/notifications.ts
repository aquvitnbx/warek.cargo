import { PoolClient } from 'pg';
import { getInternalAutomationSecret } from '@/lib/internal-api';

const INTERNAL_AUTOMATION_SECRET = getInternalAutomationSecret();

export const OUTBOUND_NOTIFICATION_WEBHOOK_URL =
  process.env.OUTBOUND_NOTIFICATION_WEBHOOK_URL ||
  process.env.N8N_WEBHOOK_URL ||
  'http://localhost:5678/webhook/notifications-outbound';

type DeliveryEventType = 'DISPATCHED' | 'ARRIVED_DESTINATION' | 'COMPLETED';
type PackageEventType = 'DELIVERED';
type QueuedNotificationPayload = {
  id: string;
  phone: string;
  text: string;
};

export async function processShipmentNotification(
  shipmentId: string,
  eventType: DeliveryEventType,
  client: PoolClient
) {
  const shpRes = await client.query(`
    SELECT 
      sp.inbound_package_id,
      p.tracking_number,
      p.customer_id,
      c.full_name as customer_name,
      c.whatsapp_number,
      c.destination_city
    FROM shipment_packages sp
    JOIN inbound_packages p ON sp.inbound_package_id = p.id
    LEFT JOIN customers c ON p.customer_id = c.id
    WHERE sp.shipment_id = $1
  `, [shipmentId]);

  const packages = shpRes.rows;
  if (packages.length === 0) return;

  const logsToTrigger: QueuedNotificationPayload[] = [];

  for (const pkg of packages) {
    const dupRes = await client.query(`
      SELECT id FROM notifications_log 
      WHERE inbound_package_id = $1 AND notification_type = $2
    `, [pkg.inbound_package_id, eventType]);

    if (dupRes.rows.length > 0) {
      continue;
    }

    const hasValidWA = Boolean(pkg.whatsapp_number && pkg.whatsapp_number.length > 5);
    const deliveryStatus = hasValidWA ? 'QUEUED' : 'SKIPPED';
    const errorReason = hasValidWA ? null : 'NO_VALID_WHATSAPP';

    const msgContent = `Automated notification for ${eventType}`;
    const logRes = await client.query(`
      INSERT INTO notifications_log (
        customer_id, inbound_package_id, shipment_id, 
        notification_channel_code, notification_type, 
        message_content, retry_count, error_reason, delivery_status_code
      ) VALUES ($1, $2, $3, 'WHATSAPP', $4, $5, 0, $6, $7)
      RETURNING id
    `, [
      pkg.customer_id, pkg.inbound_package_id, shipmentId,
      eventType, msgContent, errorReason, deliveryStatus
    ]);

    if (hasValidWA) {
      logsToTrigger.push({
        id: logRes.rows[0].id,
        phone: pkg.whatsapp_number.replace(/\D/g, ''),
        text: msgContent
      });
    }
  }

  if (logsToTrigger.length > 0) {
    fireWebhookToAutomation(eventType, logsToTrigger, shipmentId);
  }
}

export async function processPackageNotification(
  packageId: string,
  eventType: PackageEventType,
  client: PoolClient
) {
  const pkgRes = await client.query(`
    SELECT 
      p.id as inbound_package_id,
      p.tracking_number,
      p.customer_id,
      c.whatsapp_number
    FROM inbound_packages p
    LEFT JOIN customers c ON p.customer_id = c.id
    WHERE p.id = $1
  `, [packageId]);

  if (pkgRes.rows.length === 0) return;
  const pkg = pkgRes.rows[0];

  const dupRes = await client.query(`
    SELECT id FROM notifications_log 
    WHERE inbound_package_id = $1 AND notification_type = $2
  `, [pkg.inbound_package_id, eventType]);

  if (dupRes.rows.length > 0) return;

  const hasValidWA = Boolean(pkg.whatsapp_number && pkg.whatsapp_number.length > 5);
  const deliveryStatus = hasValidWA ? 'QUEUED' : 'SKIPPED';
  const errorReason = hasValidWA ? null : 'NO_VALID_WHATSAPP';

  const logRes = await client.query(`
    INSERT INTO notifications_log (
      customer_id, inbound_package_id, shipment_id, 
      notification_channel_code, notification_type, 
      message_content, retry_count, error_reason, delivery_status_code
    ) VALUES ($1, $2, NULL, 'WHATSAPP', $3, 'Automated notification', 0, $4, $5)
    RETURNING id
  `, [
    pkg.customer_id, pkg.inbound_package_id,
    eventType, errorReason, deliveryStatus
  ]);

  if (hasValidWA) {
    fireWebhookToAutomation(eventType, [{
      id: logRes.rows[0].id,
      phone: pkg.whatsapp_number.replace(/\D/g, ''),
      text: 'Automated notification'
    }]);
  }
}

function fireWebhookToAutomation(eventType: string, payloads: QueuedNotificationPayload[], shipmentId?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (INTERNAL_AUTOMATION_SECRET) {
    headers['x-internal-api-key'] = INTERNAL_AUTOMATION_SECRET;
  }

  fetch(OUTBOUND_NOTIFICATION_WEBHOOK_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      event_type: eventType,
      shipment_id: shipmentId || null,
      messages: payloads
    })
  }).catch((err: unknown) => {
    console.error('[Notification Service] Failed to hook automation webhook:', err);
  });
}
