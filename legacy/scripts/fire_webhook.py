import requests
import json
import time
import psycopg2

WEBHOOK_URL = "http://103.93.129.236:5678/webhook/warekcargo-v3"
DUMMY_PHONE = "628999888998"

def send_webhook(msg):
    payload = {
        "phone": DUMMY_PHONE,
        "pushName": "TestBot",
        "message": msg,
        "messageType": "text",
        "isGroup": "false",
        "isFromMe": "false"
    }
    try:
        r = requests.post(WEBHOOK_URL, json=payload, timeout=10)
        print(f"Webhook [{msg[:20]}...] -> HTTP {r.status_code}")
    except Exception as e:
        print(f"Webhook error: {e}")

print("=== SCENARIO 1: ONBOARDING ===")
send_webhook("Halo Nala, ini test e2e onboarding")
time.sleep(3)

print("=== SCENARIO 2: CLARIFICATION ===")
send_webhook("Saya mau daftar paket e2e")
time.sleep(3)

print("=== SCENARIO 3: INTAKE VALID ===")
# We include specific keywords so we can query it easily from DB
send_webhook("Daftar paket nama JakaTest, resi E2E-999, hub Nabire, toko Abadi E2E, dokumen rahasia")
time.sleep(3)

print("=== SCENARIO 4: LOOKUP VALID ===")
send_webhook("cek resi E2E-999")
time.sleep(3)

# Verify DB for Intake
try:
    conn = psycopg2.connect("dbname='warekcargo_db' user='postgres' host='103.93.129.236' port='5432' password='password'") # Assuming standard local access or we run this on VPS
except:
    print("Cannot connect to postgres remotely. Please check DB locally via bash.")
