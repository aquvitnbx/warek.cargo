import json

with open('deploy/n8n/workflow2_stage3.json', 'r') as f:
    wf = json.loads(f.read())

old_nodes = {n['name']: n for n in wf['nodes']}

new_nodes = [
    old_nodes['Webhook'],
    old_nodes['Edit Fields'],
    old_nodes['If'],
    old_nodes['Parse RESI']
]

# Create API Intake Node
api_node = {
  "parameters": {
    "method": "POST",
    "url": "http://172.17.0.1:3000/api/v1/nala/intake",
    "sendHeaders": True,
    "headerParameters": {
      "parameters": [
        {
          "name": "x-nala-api-key",
          "value": "NalaWarekCargo2026_SecureM2M_Secret"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": True,
    "specifyBody": "json",
    "jsonBody": "={\n  \"phone\": \"{{ $json['phone'] }}\",\n  \"customer_name\": \"{{ $json['customer_name'] }}\",\n  \"tracking_number\": \"{{ $json['tracking_number'] }}\",\n  \"hub_name\": \"{{ $json['hub_name'] }}\",\n  \"store_name\": \"{{ $json['store_name'] }}\",\n  \"item_description\": \"{{ $json['item_description'] }}\"\n}",
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [
    old_nodes['Parse RESI']['position'][0] + 250,
    old_nodes['Parse RESI']['position'][1]
  ],
  "id": "aaaaaa-1111",
  "name": "Call API Intake Internal"
}
new_nodes.append(api_node)

# Create Wablas Reply Node (Universal)
wablas_node = {
  "parameters": {
    "method": "POST",
    "url": "https://sby.wablas.com/api/send-message",
    "sendHeaders": True,
    "headerParameters": {
      "parameters": [
        {
          "name": "Authorization",
          "value": "h4fTIwq0YQYhnFDi29f8kRrYCKXy306gxZ5AzJ4LM3lkW9J9B4Pbe0i"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": True,
    "specifyBody": "json",
    "jsonBody": "={\n  \"phone\": \"{{ $node['Parse RESI'].json['phone'] }}\",\n  \"message\": \"{{ $json.human_message }}\"\n}",
    "options": {}
  },
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.4,
  "position": [
    api_node['position'][0] + 250,
    api_node['position'][1]
  ],
  "id": "bbbbbb-2222",
  "name": "Wablas Response Sender"
}
new_nodes.append(wablas_node)


# Rebuild Connections
new_connections = {
    "Webhook": {
        "main": [
            [
                {"node": "Edit Fields", "type": "main", "index": 0}
            ]
        ]
    },
    "Edit Fields": {
        "main": [
            [
                {"node": "If", "type": "main", "index": 0}
            ]
        ]
    },
    "If": {
        "main": [
            [
                {"node": "Parse RESI", "type": "main", "index": 0}
            ]
        ]
    },
    "Parse RESI": {
        "main": [
            [
                {"node": "Call API Intake Internal", "type": "main", "index": 0}
            ]
        ]
    },
    "Call API Intake Internal": {
        "main": [
            [
                {"node": "Wablas Response Sender", "type": "main", "index": 0}
            ]
        ]
    }
}

wf['nodes'] = new_nodes
wf['connections'] = new_connections

# Generate SQL Update Script
nodes_json = json.dumps(wf['nodes']).replace("'", "''")
connections_json = json.dumps(wf['connections']).replace("'", "''")

sql = f"""
UPDATE workflow_entity 
SET nodes = '{nodes_json}'::json, 
    connections = '{connections_json}'::json 
WHERE name = 'My workflow 2';
"""

with open('update_stage3.sql', 'w') as f:
    f.write(sql)
print("Stage 3 patch created!")
