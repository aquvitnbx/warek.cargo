import json

with open('deploy/n8n/workflow2.json', 'r') as f:
    wf = json.loads(f.read())

nodes = wf['nodes']
connections = wf['connections']

# 1. Sanitize whatsapp number in 'Parse RESI'
for n in nodes:
    if n['name'] == 'Parse RESI':
        n['parameters']['jsCode'] = n['parameters']['jsCode'].replace(
            "const msg = $json.message || '';",
            "const msg = $json.message || '';\nlet sanitized_phone = ($json.phone || '').toString().replace(/^08/, '628').replace(/\\D/g, '');"
        ).replace(
            "json: {",
            "json: {\n      phone: sanitized_phone,"
        )

# 2. Synchronize initial status to RECEIVED_AT_HUB in 'Insert Package'
insert_node = next((n for n in nodes if n['name'] == 'Insert Package'), None)
if insert_node:
    insert_node['parameters']['query'] = insert_node['parameters']['query'].replace("'REGISTERED'", "'RECEIVED_AT_HUB'")
    insert_pos_x = insert_node['position'][0]
    insert_pos_y = insert_node['position'][1]

# 3. Add History Insertion Node
history_id = 'e456ac4e-0922-482d-8888-af28392a10bf'
history_node = {
  'parameters': {
    'operation': 'executeQuery',
    'query': "INSERT INTO inbound_package_status_history (inbound_package_id, to_status_code, changed_source, change_notes) VALUES ($1, 'RECEIVED_AT_HUB', 'NALA_BOT', 'Pendaftaran Intake Melalui WhatsApp Nala Bot');",
    'options': {
      'queryReplacement': '=[ "={{ $json.id }}" ]'
    }
  },
  'type': 'n8n-nodes-base.postgres',
  'typeVersion': 2.6,
  'position': [insert_pos_x + 250, insert_pos_y],
  'id': history_id,
  'name': 'INJECT HISTORY',
  'credentials': {
    'postgres': {
      'id': 'L6VVg71jbu14wSCH',
      'name': 'Postgres account'
    }
  }
}
nodes.append(history_node)

# Rewrite Insert Package's connection to INJECT HISTORY instead of BALAS SUKSES
success_reply_node_name = connections['Insert Package']['main'][0][0]['node']
connections['Insert Package']['main'][0][0]['node'] = 'INJECT HISTORY'
connections['INJECT HISTORY'] = {
    'main': [
        [ { 'node': success_reply_node_name, 'type': 'main', 'index': 0 } ]
    ]
}

# 4. Add Fallback Node if Hub is Not Found
hub_node = next((n for n in nodes if n['name'] == 'CARI HUB'), None)
hub_pos_x = hub_node['position'][0]
hub_pos_y = hub_node['position'][1]

if_hub_id = 'fb2a1d2e-4b2a-4a2a-8c2a-df51c72718cc'
if_hub_node = {
  'parameters': {
    'conditions': {
      'options': {'caseSensitive': True, 'typeValidation': 'loose', 'version': 3},
      'conditions': [
        {'id': 'cond-1', 'leftValue': '={{$json.id}}', 'rightValue': '', 'operator': {'type': 'string', 'operation': 'notEmpty', 'singleValue': True}}
      ],
      'combinator': 'and'
    },
    'options': {}
  },
  'type': 'n8n-nodes-base.if',
  'typeVersion': 2.3,
  'position': [hub_pos_x + 200, hub_pos_y],
  'id': if_hub_id,
  'name': 'HUB DITEMUKAN?'
}
nodes.append(if_hub_node)

fallback_reply_id = 'bbbbbbbb-4b2a-4a2a-8c2a-df51c72718cc'
fallback_reply_node = {
  'parameters': {
    'method': 'POST',
    'url': 'https://sby.wablas.com/api/send-message',
    'sendHeaders': True,
    'headerParameters': {
      'parameters': [
        {'name': 'Authorization', 'value': 'h4fTIwq0YQYhnFDi29f8kRrYCKXy306gxZ5AzJ4LM3lkW9J9B4Pbe0i'},
        {'name': 'Content-Type', 'value': 'application/json'}
      ]
    },
    'sendBody': True,
    'specifyBody': 'json',
    'jsonBody': '={\n  "phone": "={{ $node[\'Parse RESI\'].json[\'phone\'] }}",\n  "message": "={{ \'Maaf, Resi tidak dapat didaftarkan karena Cabang/Hub (\' + $node[\'Parse RESI\'].json[\'hub_name\'] + \') tidak ditemukan dalam sistem kami. Silakan periksa kembali.\' }}"\n}',
    'options': {}
  },
  'type': 'n8n-nodes-base.httpRequest',
  'typeVersion': 4.4,
  'position': [hub_pos_x + 400, hub_pos_y + 200],
  'id': fallback_reply_id,
  'name': 'BALAS GAGAL HUB'
}
nodes.append(fallback_reply_node)


ambil_customer_node_name = connections['CARI HUB']['main'][0][0]['node']
connections['CARI HUB']['main'][0][0]['node'] = 'HUB DITEMUKAN?'
connections['HUB DITEMUKAN?'] = {
    'main': [
        [ { 'node': ambil_customer_node_name, 'type': 'main', 'index': 0 } ],
        [ { 'node': 'BALAS GAGAL HUB', 'type': 'main', 'index': 0 } ]
    ]
}

wf['nodes'] = nodes
wf['connections'] = connections

with open('deploy/n8n/workflow2_patched.json', 'w') as f:
    f.write(json.dumps(wf, indent=2))
    
print("Patch successfully applied!")
