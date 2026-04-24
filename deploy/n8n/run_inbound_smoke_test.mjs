const webhookUrl = process.env.N8N_INBOUND_WEBHOOK_URL;

if (!webhookUrl) {
  console.error('Set N8N_INBOUND_WEBHOOK_URL terlebih dulu.');
  process.exit(1);
}

const cases = [
  {
    name: 'onboarding',
    payload: {
      phone: '081234567890',
      pushName: 'Smoke Test',
      message: 'Halo, saya mau kirim paket',
      messageType: 'text',
      isGroup: false,
      isFromMe: false,
    },
  },
  {
    name: 'tracking',
    payload: {
      phone: '081234567890',
      pushName: 'Smoke Test',
      message: 'Cek resi WKC-TEST-001',
      messageType: 'text',
      isGroup: false,
      isFromMe: false,
    },
  },
  {
    name: 'intake-single-message',
    payload: {
      phone: '081234567890',
      pushName: 'Smoke Test',
      message: 'Hub Jakarta. Nama Habib. Resi ABC12345. Tujuan Nabire. Isi paket baju 2 pcs.',
      messageType: 'text',
      isGroup: false,
      isFromMe: false,
    },
  },
];

for (const testCase of cases) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(testCase.payload),
  });

  const text = await response.text();
  console.log(`\n[${testCase.name}] status=${response.status}`);
  console.log(text);
}
