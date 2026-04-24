const webhookUrl = process.env.N8N_NOTIFICATIONS_WEBHOOK_URL;

if (!webhookUrl) {
  console.error('Set N8N_NOTIFICATIONS_WEBHOOK_URL terlebih dulu.');
  process.exit(1);
}

const payload = {
  event_type: 'PAYMENT_REMINDER',
  shipment_id: '00000000-0000-0000-0000-000000000000',
  messages: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      phone: '081234567890',
      text: 'Ini pesan uji outbound canonical WarekCargo.',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      phone: '',
      text: 'Item ini sengaja invalid agar jalur SKIPPED ikut teruji.',
    },
  ],
};

const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
});

console.log(`status=${response.status}`);
console.log(await response.text());
