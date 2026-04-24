import json

with open('deploy/n8n/workflow2_stage3.json', 'r') as f:
    wf = json.loads(f.read())

old_nodes = {n['name']: n for n in wf['nodes']}
base_x = 368
base_y = 0

new_nodes = [old_nodes['Webhook'], old_nodes['Edit Fields']]

# 1. Pre-Filter Guardrail
pre_filter_node = {
  "parameters": {
    "conditions": {
      "options": {"caseSensitive": False, "typeValidation": "strict", "version": 3},
      "conditions": [
        {"id": "cond-0", "leftValue": "={{$json.messageType}}", "rightValue": "text", "operator": {"type": "string", "operation": "equals"}},
        {"id": "cond-1", "leftValue": "={{$json.isGroup}}", "rightValue": "false", "operator": {"type": "string", "operation": "equals"}},
        {"id": "cond-2", "leftValue": "={{$json.isFromMe}}", "rightValue": "false", "operator": {"type": "string", "operation": "equals"}},
        {"id": "cond-3", "leftValue": "={{$json.message.length}}", "rightValue": 1000, "operator": {"type": "number", "operation": "smaller"}},
        {"id": "cond-4", "leftValue": "={{$json.message}}", "rightValue": "resi|paket|kirim|hub|cabang|lacak|dimana|cek", "operator": {"type": "string", "operation": "regex"}}
      ],
      "combinator": "and"
    },
    "options": {}
  },
  "type": "n8n-nodes-base.if",
  "typeVersion": 2.3,
  "position": [base_x, base_y],
  "id": "c1c1c1c1-prefilter",
  "name": "Pre-Filter Guardrail"
}
new_nodes.append(pre_filter_node)

fallback_prefilter_node = {
  "parameters": {
    "method": "POST",
    "url": "https://sby.wablas.com/api/send-message",
    "sendHeaders": True,
    "headerParameters": {"parameters": [{"name": "Authorization", "value": "h4fTIwq0YQYhnFDi29f8kRrYCKXy306gxZ5AzJ4LM3lkW9J9B4Pbe0i"}, {"name": "Content-Type", "value": "application/json"}]},
    "sendBody": True,
    "specifyBody": "json",
    "jsonBody": "={\n  \"phone\": \"={{ $json['phone'] }}\",\n  \"message\": \"🤖 Halo, format pesan Anda belum dikenali oleh sistem cek/pendaftaran resi kami, atau teks terlalu panjang.\"\n}",
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [base_x + 250, base_y + 200],
  "id": "f2f2f2f2-prefilter_fail",
  "name": "Balas Pre-Filter"
}
new_nodes.append(fallback_prefilter_node)

# Sanitasi JS
sanitize_node = {
  "parameters": {
    "jsCode": "const phoneRaw = ($json.body && $json.body.phone) ? $json.body.phone : ($json.phone || '');\nreturn [{\n  json: {\n    ...$json,\n    phone: phoneRaw.toString().replace(/^08/, '628').replace(/\\D/g, ''),\n    message: ($json.body && $json.body.message) ? $json.body.message : $json.message\n  }\n}];"
  },
  "type": "n8n-nodes-base.code",
  "typeVersion": 2,
  "position": [base_x + 250, base_y - 200],
  "id": "s1s1s1s1-sanitize",
  "name": "Sanitasi Phone"
}
new_nodes.append(sanitize_node)

# API GET Session
get_session_node = {
  "parameters": {
    "method": "GET",
    "url": "http://172.17.0.1:3000/api/v1/nala/session",
    "sendQuery": True,
    "queryParameters": {"parameters": [{"name": "phone", "value": "={{ $json.phone }}"}]},
    "sendHeaders": True,
    "headerParameters": {"parameters": [{"name": "x-nala-api-key", "value": "NalaWarekCargo2026_SecureM2M_Secret"}]},
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [base_x + 500, base_y - 200],
  "id": "z9z9z9z9-getsession",
  "name": "API GET Session"
}
new_nodes.append(get_session_node)

# AI Parser Phase 3
openai_node = {
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/chat/completions",
    "sendHeaders": True,
    "headerParameters": {
      "parameters": [
        {"name": "Authorization", "value": "Bearer ={{ $env['OPENAI_API_KEY'] || 'MASUKAN_API_KEY_ANDA_DI_ENV_VPS' }}"},
        {"name": "Content-Type", "value": "application/json"}
      ]
    },
    "sendBody": True,
    "specifyBody": "json",
    "jsonBody": "={\n  \"model\": \"gpt-4o-mini\",\n  \"temperature\": 0.0,\n  \"response_format\": {\n    \"type\": \"json_schema\",\n    \"json_schema\": {\n      \"name\": \"nala_extraction_v3\",\n      \"strict\": true,\n      \"schema\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"intent\": { \"type\": \"string\", \"enum\": [\"INTAKE\", \"LOOKUP\", \"OTHER\"] },\n          \"tracking_identifier\": { \"type\": [\"string\", \"null\"] },\n          \"customer_name\": { \"type\": [\"string\", \"null\"] },\n          \"tracking_number\": { \"type\": [\"string\", \"null\"] },\n          \"hub_name\": { \"type\": [\"string\", \"null\"] },\n          \"store_name\": { \"type\": [\"string\", \"null\"] },\n          \"item_description\": { \"type\": [\"string\", \"null\"] },\n          \"is_data_complete\": { \"type\": \"boolean\" },\n          \"missing_critical_fields\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n          \"requires_clarification\": { \"type\": \"boolean\" },\n          \"clarification_question\": { \"type\": [\"string\", \"null\"] }\n        },\n        \"required\": [\"intent\", \"tracking_identifier\", \"customer_name\", \"tracking_number\", \"hub_name\", \"store_name\", \"item_description\", \"is_data_complete\", \"missing_critical_fields\", \"requires_clarification\", \"clarification_question\"],\n        \"additionalProperties\": false\n      }\n    }\n  },\n  \"messages\": [\n    {\n      \"role\": \"system\",\n      \"content\": \"Kamu adalah Nala. Jika ucapan bertanya soal resi: intent=LOOKUP & isi tracking_identifier. Jika pendaftaran paket: intent=INTAKE & isi tracking_number gabung partial_data sesi.\"\n    },\n    {\n      \"role\": \"user\",\n      \"content\": \"={{ $json.code === 'FOUND_ACTIVE_SESSION' ? 'Ingatan Partial: ' + JSON.stringify($json.data.partial_data) + '\\n\\nPESAN BARU: ' + $('Sanitasi Phone').item.json.message : $('Sanitasi Phone').item.json.message }}\"\n    }\n  ]\n}",
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [base_x + 750, base_y - 200],
  "id": "a3a3a3a3-openai",
  "name": "AI Parser (GPT)"
}
new_nodes.append(openai_node)

# Unwrap
unwrap_ai = {
  "parameters": {
    "mode": "raw",
    "jsonOutput": "={\n  ...JSON.parse($json.choices[0].message.content),\n  phone: $('Sanitasi Phone').item.json.phone,\n  session_id: $('API GET Session').item.json.code === 'FOUND_ACTIVE_SESSION' ? $('API GET Session').item.json.data.session_id : undefined\n}"
  },
  "type": "n8n-nodes-base.set",
  "typeVersion": 3.4,
  "position": [base_x + 1000, base_y - 200],
  "id": "u4u4u4u4-unwrap",
  "name": "Unwrap JSON AI"
}
new_nodes.append(unwrap_ai)

# API POST Session
post_session_node = {
  "parameters": {
    "method": "POST",
    "url": "http://172.17.0.1:3000/api/v1/nala/session",
    "sendHeaders": True,
    "headerParameters": {"parameters": [{"name": "x-nala-api-key", "value": "NalaWarekCargo2026_SecureM2M_Secret"}, {"name": "Content-Type", "value": "application/json"}]},
    "sendBody": True,
    "specifyBody": "json",
    "jsonBody": "={\n  \"phone\": \"{{ $json.phone }}\",\n  \"intent\": \"{{ $json.intent }}\",\n  \"is_data_complete\": {{ $json.is_data_complete }},\n  \"session_id\": \"{{ $json.session_id || '' }}\",\n  \"missing_critical_fields\": {{ JSON.stringify($json.missing_critical_fields) }},\n  \"partial_data\": {\n    \"tracking_identifier\": \"{{ $json.tracking_identifier }}\",\n    \"customer_name\": \"{{ $json.customer_name }}\",\n    \"tracking_number\": \"{{ $json.tracking_number }}\",\n    \"hub_name\": \"{{ $json.hub_name }}\",\n    \"store_name\": \"{{ $json.store_name }}\",\n    \"item_description\": \"{{ $json.item_description }}\"\n  }\n}",
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [base_x + 1250, base_y - 200],
  "id": "q1q1q1q1-postsession",
  "name": "API POST Session"
}
new_nodes.append(post_session_node)

# Switch Router Version 3.1
route_intent_node = {
  "parameters": {
    "rules": {
      "values": [
        {
          "conditions": {"options": {"caseSensitive": True, "typeValidation": "strict", "version": 2}, "conditions": [
            {"id": "cond-1", "leftValue": "={{ $('Unwrap JSON AI').item.json.intent }}", "rightValue": "INTAKE", "operator": {"type": "string", "operation": "equals"}},
            {"id": "cond-2", "leftValue": "={{ $('Unwrap JSON AI').item.json.is_data_complete }}", "rightValue": "true", "operator": {"type": "boolean", "operation": "true"}}
          ], "combinator": "and"}
        },
        {
          "conditions": {"options": {"caseSensitive": True, "typeValidation": "strict", "version": 2}, "conditions": [
            {"id": "cond-3", "leftValue": "={{ $('Unwrap JSON AI').item.json.intent }}", "rightValue": "LOOKUP", "operator": {"type": "string", "operation": "equals"}},
            {"id": "cond-4", "leftValue": "={{ !!$('Unwrap JSON AI').item.json.tracking_identifier }}", "rightValue": "true", "operator": {"type": "boolean", "operation": "true"}}
          ], "combinator": "and"}
        }
      ]
    },
    "fallbackOutput": 2
  },
  "type": "n8n-nodes-base.switch",
  "typeVersion": 3.1,
  "position": [base_x + 1500, base_y - 200],
  "id": "switch_intent_node",
  "name": "Intent Switch"
}
new_nodes.append(route_intent_node)

# ----- OUTPUT 0: INTAKE FLOW -----
api_intake_node = {
  "parameters": {
    "method": "POST",
    "url": "http://172.17.0.1:3000/api/v1/nala/intake",
    "sendHeaders": True,
    "headerParameters": {"parameters": [{"name": "x-nala-api-key", "value": "NalaWarekCargo2026_SecureM2M_Secret"}, {"name": "Content-Type", "value": "application/json"}]},
    "sendBody": True,
    "specifyBody": "json",
    "jsonBody": "={\n  \"phone\": \"={{ $('Sanitasi Phone').item.json.phone }}\",\n  \"customer_name\": \"{{ $('Unwrap JSON AI').item.json.customer_name }}\",\n  \"tracking_number\": \"{{ $('Unwrap JSON AI').item.json.tracking_number }}\",\n  \"hub_name\": \"{{ $('Unwrap JSON AI').item.json.hub_name }}\",\n  \"store_name\": \"{{ $('Unwrap JSON AI').item.json.store_name }}\",\n  \"item_description\": \"{{ $('Unwrap JSON AI').item.json.item_description }}\"\n}",
    "options": {},
    "continueOnFail": True
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [base_x + 1750, base_y - 400],
  "id": "a1a1a1a1-api_internal",
  "name": "API Internal Intake"
}
new_nodes.append(api_intake_node)

# ----- OUTPUT 1: LOOKUP FLOW -----
api_tracking_node = {
  "parameters": {
    "method": "GET",
    "url": "http://172.17.0.1:3000/api/v1/nala/tracking",
    "sendQuery": True,
    "queryParameters": {"parameters": [{"name": "awb", "value": "={{ $('Unwrap JSON AI').item.json.tracking_identifier }}"}]},
    "sendHeaders": True,
    "headerParameters": {"parameters": [{"name": "x-nala-api-key", "value": "NalaWarekCargo2026_SecureM2M_Secret"}]},
    "options": {},
    "continueOnFail": True
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [base_x + 1750, base_y],
  "id": "tracking_api_node",
  "name": "API Internal Tracking"
}
new_nodes.append(api_tracking_node)

# Merge back the API responses before checking Fallbacks
merge_responses = {
  "parameters": {"mode": "passThrough", "output": "input1"},
  "type": "n8n-nodes-base.merge",
  "typeVersion": 2.1,
  "position": [base_x + 2000, base_y - 200],
  "id": "merge1_node",
  "name": "Merge Responses"
}
new_nodes.append(merge_responses)

# Fallback Guard for merged APIs
api_fallback_guard = {
  "parameters": {
    "conditions": {"options": {}, "conditions": [
        {"id": "cond-1", "leftValue": "={{$json.error === undefined}}", "rightValue": "true", "operator": {"type": "string", "operation": "equals"}}
    ], "combinator": "and"},
    "options": {}
  },
  "type": "n8n-nodes-base.if",
  "typeVersion": 2.3,
  "position": [base_x + 2250, base_y - 200],
  "id": "x7x7x7x7-apifallback",
  "name": "API OK?"
}
new_nodes.append(api_fallback_guard)

wablas_final = {
  "parameters": {
    "method": "POST",
    "url": "https://sby.wablas.com/api/send-message",
    "sendHeaders": True,
    "headerParameters": {"parameters": [{"name": "Authorization", "value": "h4fTIwq0YQYhnFDi29f8kRrYCKXy306gxZ5AzJ4LM3lkW9J9B4Pbe0i"}, {"name": "Content-Type", "value": "application/json"}]},
    "sendBody": True,
    "specifyBody": "json",
    "jsonBody": "={\n  \"phone\": \"={{ $('Sanitasi Phone').item.json.phone }}\",\n  \"message\": \"={{ $json.human_message || 'OK' }}\"\n}",
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [base_x + 2500, base_y - 400],
  "id": "bbbbbb-2222",
  "name": "Wablas Response Sender"
}
new_nodes.append(wablas_final)

api_error_reply = {
  "parameters": {
    "method": "POST",
    "url": "https://sby.wablas.com/api/send-message",
    "sendHeaders": True,
    "headerParameters": {"parameters": [{"name": "Authorization", "value": "h4fTIwq0YQYhnFDi29f8kRrYCKXy306gxZ5AzJ4LM3lkW9J9B4Pbe0i"}, {"name": "Content-Type", "value": "application/json"}]},
    "sendBody": True,
    "specifyBody": "json",
    "jsonBody": "={\n  \"phone\": \"={{ $('Sanitasi Phone').item.json.phone }}\",\n  \"message\": \"🔴 Sistem Pusat WarekCargo sedang sibuk. Transaksi Anda tidak terbaca. Mohon lapor ulang nanti.\"\n}",
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [base_x + 2500, base_y],
  "id": "y8y8y8y8-apidown",
  "name": "Balas API Down"
}
new_nodes.append(api_error_reply)

# ----- OUTPUT 2: CLARIFICATION/FALLBACK FLOW -----
clarification_reply = {
  "parameters": {
    "method": "POST",
    "url": "https://sby.wablas.com/api/send-message",
    "sendHeaders": True,
    "headerParameters": {"parameters": [{"name": "Authorization", "value": "h4fTIwq0YQYhnFDi29f8kRrYCKXy306gxZ5AzJ4LM3lkW9J9B4Pbe0i"}, {"name": "Content-Type", "value": "application/json"}]},
    "sendBody": True,
    "specifyBody": "json",
    "jsonBody": "={\n  \"phone\": \"={{ $('Sanitasi Phone').item.json.phone }}\",\n  \"message\": \"={{ $('Unwrap JSON AI').item.json.intent === 'OTHER' ? 'Nala tidak mengerti pesan ini.' : ($('Unwrap JSON AI').item.json.clarification_question || 'Data belum lengkap.') }}\"\n}",
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [base_x + 1750, base_y + 200],
  "id": "w6w6w6w6-clarification",
  "name": "Balas Clarification"
}
new_nodes.append(clarification_reply)

# Connect
new_conn = {
  "Webhook": {"main": [[{"node": "Edit Fields", "type": "main", "index": 0}]]},
  "Edit Fields": {"main": [[{"node": "Pre-Filter Guardrail", "type": "main", "index": 0}]]},
  "Pre-Filter Guardrail": {
    "main": [
      [{"node": "Sanitasi Phone", "type": "main", "index": 0}], # true
      [{"node": "Balas Pre-Filter", "type": "main", "index": 0}] # false
    ]
  },
  "Sanitasi Phone": {"main": [[{"node": "API GET Session", "type": "main", "index": 0}]]},
  "API GET Session": {"main": [[{"node": "AI Parser (GPT)", "type": "main", "index": 0}]]},
  "AI Parser (GPT)": {"main": [[{"node": "Unwrap JSON AI", "type": "main", "index": 0}]]},
  "Unwrap JSON AI": {"main": [[{"node": "API POST Session", "type": "main", "index": 0}]]},
  "API POST Session": {"main": [[{"node": "Intent Switch", "type": "main", "index": 0}]]},
  "Intent Switch": {
    "main": [
      [{"node": "API Internal Intake", "type": "main", "index": 0}],   # Output 0 (INTAKE & COMPLETE)
      [{"node": "API Internal Tracking", "type": "main", "index": 0}], # Output 1 (LOOKUP & IDENTIFIER_READY)
      [{"node": "Balas Clarification", "type": "main", "index": 0}]    # Output 2 (Fallback)
    ]
  },
  "API Internal Tracking": {"main": [[{"node": "Merge Responses", "type": "main", "index": 0}]]},
  "API Internal Intake": {"main": [[{"node": "Merge Responses", "type": "main", "index": 1}]]}, # Wire to input2
  "Merge Responses": {"main": [[{"node": "API OK?", "type": "main", "index": 0}]]},
  "API OK?": {
    "main": [
      [{"node": "Wablas Response Sender", "type": "main", "index": 0}],
      [{"node": "Balas API Down", "type": "main", "index": 0}]
    ]
  }
}

wf['nodes'] = new_nodes
wf['connections'] = new_conn

nodes_json = json.dumps(wf['nodes']).replace("'", "''")
connections_json = json.dumps(wf['connections']).replace("'", "''")

sql = f"""
UPDATE workflow_entity 
SET nodes = '{nodes_json}'::json, 
    connections = '{connections_json}'::json 
WHERE name = 'My workflow 2';
"""
with open('update_phase3.sql', 'w') as f:
    f.write(sql)
