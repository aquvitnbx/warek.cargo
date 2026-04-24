#!/bin/bash
WEBHOOK_URL="http://103.93.129.236:5678/webhook/warekcargo-v3"
DUMMY_PHONE="628999888998"

send_webhook() {
  local msg="$1"
  curl -s -X POST $WEBHOOK_URL -H "Content-Type: application/json" -d "{
    \"phone\": \"$DUMMY_PHONE\",
    \"pushName\": \"TestBot\",
    \"message\": \"$msg\",
    \"messageType\": \"text\",
    \"isGroup\": \"false\",
    \"isFromMe\": \"false\"
  }"
  echo ""
  sleep 4
}

echo "=== SCENARIO 1: ONBOARDING ==="
send_webhook "Halo Nala, ini test e2e onboarding"

echo "=== SCENARIO 2: CLARIFICATION ==="
send_webhook "Saya mau daftar paket e2e"

echo "=== SCENARIO 3: INTAKE VALID ==="
send_webhook "Daftar paket nama JakaTest, resi E2E-999, hub Nabire, toko Abadi E2E, dokumen rahasia"

echo "=== SCENARIO 4: LOOKUP VALID ==="
send_webhook "cek resi E2E-999"
