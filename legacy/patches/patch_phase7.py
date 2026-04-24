import json
import random
import string

def r_id():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=9))

with open('/Users/achmadhabib/.gemini/antigravity/brain/f2c96952-19dd-4a05-9296-1c08c3b4e2c5/scratch/n8n_inbound_fix.json', 'r') as f:
    wf = json.load(f)

wf['name'] = "My workflow 4 (Endpoint Nala V7)"
if 'id' in wf:
    del wf['id']

# 2
for n in wf['nodes']:
    if n['name'] == 'AI Parser (GPT)':
        n.update({
            "parameters": {
                "method": "POST",
                "url": "http://172.17.0.1:3000/api/v1/nala/interpret",
                "sendHeaders": True,
                "headerParameters": {
                    "parameters": [
                        {"name": "x-nala-api-key", "value": "NalaWarekCargo2026_SecureM2M_Secret"},
                        {"name": "Content-Type", "value": "application/json"}
                    ]
                },
                "sendBody": True,
                "specifyBody": "json",
                "jsonBody": "={}",
                "options": {}
            },
            "id": "nala-interpret-api",
            "name": "Nala Interpret API",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2
        })

# 3
for n in wf['nodes']:
    if n['name'] == 'Unwrap JSON AI':
        n['parameters']['jsonOutput'] = "={{ Object.assign({}, $json.data, { phone: $('Sanitasi Phone').item.json.phone, session_id: $('API GET Session').item.json.code === 'FOUND_ACTIVE_SESSION' ? $('API GET Session').item.json.data.session_id : undefined }) }}"
        if 'jsCode' in n['parameters']:
            del n['parameters']['jsCode']

# 4
actions = [
    'PROCEED_TO_INTAKE', 'PROCEED_TO_LOOKUP', 'REPLY_ONBOARDING',
    'REPLY_RETURNING_ONBOARDING', 'REPLY_HUB_CONFIRMATION',
    'REPLY_FIELD_EXPLANATION', 'REPLY_CLARIFICATION', 'REPLY_FALLBACK_ADMIN'
]
for n in wf['nodes']:
    if n['name'] == 'Intent Switch':
        rules = []
        for i, a in enumerate(actions):
            rules.append({
                "conditions": {
                    "options": {},
                    "conditions": [{
                        "id": "cond-" + str(i+1),
                        "leftValue": "={{ $('Unwrap JSON AI').item.json.recommended_action }}",
                        "rightValue": a,
                        "operator": { "type": "string", "operation": "equals" }
                    }],
                    "combinator": "and"
                }
            })
        n['parameters'] = {"rules": {"values": rules}, "fallbackOutput": 7}

# 4.5
balas = next((n for n in wf['nodes'] if n['name'] == 'Balas Clarification'), None)
if balas and not next((n for n in wf['nodes'] if n['name'] == 'Balas Onboarding Baku'), None):
    def dup(name, offset):
        import copy
        new_n = copy.deepcopy(balas)
        new_n['id'] = 'node-' + r_id()
        new_n['name'] = name
        new_n['position'][1] += offset
        wf['nodes'].append(new_n)
    dup('Balas Onboarding Baku', 200)
    dup('Balas Returning Onboarding', 300)
    dup('Balas Hub Confirmation', 400)
    dup('Balas Fallback Admin', 500)

# 5
cons = wf['connections']
if 'API GET Session' in cons:
    cons['API GET Session']['main'][0][0]['node'] = 'Nala Interpret API'

cons['Nala Interpret API'] = { "main": [[{ "node": "Unwrap JSON AI", "type": "main", "index": 0 }]] }
if 'AI Parser (GPT)' in cons:
    del cons['AI Parser (GPT)']

cons['Intent Switch'] = { "main": [
    [{ "node": "API Internal Intake", "type": "main", "index": 0 }],
    [{ "node": "API Internal Tracking", "type": "main", "index": 0 }],
    [{ "node": "Balas Onboarding Baku", "type": "main", "index": 0 }],
    [{ "node": "Balas Returning Onboarding", "type": "main", "index": 0 }],
    [{ "node": "Balas Hub Confirmation", "type": "main", "index": 0 }],
    [{ "node": "Balas Clarification", "type": "main", "index": 0 }],
    [{ "node": "Balas Clarification", "type": "main", "index": 0 }],
    [{ "node": "Balas Fallback Admin", "type": "main", "index": 0 }]
]}

for n in wf['nodes']:
    if n['name'] == 'Webhook':
        n['parameters']['path'] = 'warekcargo-v4'
        n['webhookId'] = 'v4-webhook-' + r_id()

def safeJSON(name, expr):
    for n in wf['nodes']:
        if n['name'] == name:
            if 'parameters' not in n:
                n['parameters'] = {}
            n['parameters']['jsonBody'] = "={{ " + expr + " }}"

safeJSON('Balas Pre-Filter', "{ phone: $json.phone, message: '🤖 Halo, format pesan Anda belum dikenali oleh sistem cek/pendaftaran resi kami.' }")
safeJSON('Nala Interpret API', "{ message: $('Sanitasi Phone').item.json.message, phone: $('Sanitasi Phone').item.json.phone, partial_data: Object.assign({}, $('API GET Session').item.json.data && $('API GET Session').item.json.data.partial_data ? $('API GET Session').item.json.data.partial_data : {}, $('API GET Session').item.json.data && $('API GET Session').item.json.data.recognized_name ? { recognized_name: $('API GET Session').item.json.data.recognized_name } : {}) }")
safeJSON('API POST Session', "{ phone: $('Sanitasi Phone').item.json.phone, intent: $('Unwrap JSON AI').item.json.intent, is_data_complete: $('Unwrap JSON AI').item.json.is_data_complete, session_id: $('Unwrap JSON AI').item.json.session_id || '', missing_critical_fields: $('Unwrap JSON AI').item.json.missing_critical_fields || [], partial_data: { hub_selection: $('Unwrap JSON AI').item.json.extracted_data && $('Unwrap JSON AI').item.json.extracted_data.hub_selection ? $('Unwrap JSON AI').item.json.extracted_data.hub_selection : null, customer_name: $('Unwrap JSON AI').item.json.extracted_data && $('Unwrap JSON AI').item.json.extracted_data.customer_name ? $('Unwrap JSON AI').item.json.extracted_data.customer_name : null, packages: $('Unwrap JSON AI').item.json.extracted_data && $('Unwrap JSON AI').item.json.extracted_data.packages ? $('Unwrap JSON AI').item.json.extracted_data.packages : [] } }")
safeJSON('API Internal Intake', "{ phone: $('Sanitasi Phone').item.json.phone, owner_name: $('Unwrap JSON AI').item.json.extracted_data.customer_name, hub_selection: $('Unwrap JSON AI').item.json.extracted_data.hub_selection, packages: $('Unwrap JSON AI').item.json.extracted_data.packages }")
safeJSON('Wablas Response Sender', "{ phone: $('Sanitasi Phone').item.json.phone, message: $json.human_message || 'Data telah tercatat, namun tidak ada pesan sapaan dari sistem.' }")
safeJSON('Balas API Down', "{ phone: $('Sanitasi Phone').item.json.phone, message: '🔴 Mohon maaf, Nala saat ini tidak bisa terhubung dengan sistem pergudangan utama. Mohon coba lagi nanti.' }")
safeJSON('Balas Clarification', "{ phone: $('Sanitasi Phone').item.json.phone, message: $('Unwrap JSON AI').item.json.clarification_question }")
safeJSON('Balas Onboarding Baku', "{ phone: $('Sanitasi Phone').item.json.phone, message: 'Halo 👋\\nSaya Nala, asisten WarekCargo yang membantu proses pengiriman barang Anda.\\n\\nWarekCargo melayani pengiriman barang melalui hub penerimaan kami.\\nUntuk info cara kerja layanan, silakan baca panduan ini:\\nhttps://warekcargo.com/faq\\n\\nSebelum lanjut, paket Anda akan dikirim ke hub penerimaan yang mana?\\nPilih salah satu:\\n- Jakarta\\n- Surabaya\\n- Makassar' }")
safeJSON('Balas Returning Onboarding', "{ phone: $('Sanitasi Phone').item.json.phone, message: 'Halo Bapak/Ibu ' + ($('API GET Session').item.json.data && $('API GET Session').item.json.data.recognized_name ? $('API GET Session').item.json.data.recognized_name : '') + ' 👋\\nSenang bertutur sapa kembali bersama Anda di WarekCargo.\\n(Mohon abaikan jika nama kurang sesuai).\\n\\nApakah Anda ingin mengirim paket hari ini?\\nSilakan pilih hub penerimaan Anda terlebih dahulu:\\n- Jakarta\\n- Surabaya\\n- Makassar' }")
safeJSON('Balas Hub Confirmation', "{ phone: $('Sanitasi Phone').item.json.phone, message: 'Alamat Hub ' + $('Unwrap JSON AI').item.json.extracted_data.hub_selection + ':\\n' + ($('Unwrap JSON AI').item.json.extracted_data.hub_selection === 'JAKARTA' ? 'Pergudangan Angke Blok N' : $('Unwrap JSON AI').item.json.extracted_data.hub_selection === 'SURABAYA' ? 'Margomulyo Permai' : 'KIMA Gudang C') + '\\n\\nMohon lengkapi informasi berikut:\\n- Nama Pemilik Barang:\\n- Nomor Resi:\\n- Kota Tujuan:\\n- Isi Paket:' }")
safeJSON('Balas Fallback Admin', "{ phone: $('Sanitasi Phone').item.json.phone, message: 'Mohon maaf, saya belum bisa membantu menjawab pertanyaan Anda secara tepat.\\n\\nSilakan hubungi admin WarekCargo melalui WhatsApp berikut untuk bantuan langsung:\\nhttps://wa.me/6281310099141\\n\\nAgar lebih cepat dibantu, silakan sertakan pertanyaan Anda dan nomor resi jika sudah ada.' }")

with open('/Users/achmadhabib/Documents/Claude/Projects/WarekCargo/n8n_v4_clone.json', 'w') as f:
    json.dump(wf, f, indent=2)

print('n8n_v4_clone.json generated.')
