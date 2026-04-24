const fs = require('fs');
let data = fs.readFileSync('./deploy/n8n/workflows.json', 'utf8');
let lines = data.split('\n');

// The second line is 'My workflow 2'
let wf = JSON.parse(lines[1]);
let nodes = wf.nodes;

// 1. Sanitize whatsapp number in "Parse RESI"
let parseResiNode = nodes.find(n => n.name === 'Parse RESI');
parseResiNode.parameters.jsCode = parseResiNode.parameters.jsCode.replace(
  "const msg = $json.message || '';",
  "const msg = $json.message || '';\nlet sanitized_phone = ($json.phone || '').toString().replace(/^08/, '628').replace(/\\D/g, '');"
).replace(
   "json: {",
   "json: {\n      phone: sanitized_phone,"
);

// 2. Synchronize initial status to RECEIVED_AT_HUB in "Insert Package"
let insertPackageNode = nodes.find(n => n.name === 'Insert Package');
insertPackageNode.parameters.query = insertPackageNode.parameters.query.replace(
  "'REGISTERED'",
  "'RECEIVED_AT_HUB'"
);

// 3. Add History Insertion Node
// Find Insert Package node position
let insertPosX = insertPackageNode.position[0];
let insertPosY = insertPackageNode.position[1];

let historyNode = {
  "parameters": {
    "operation": "executeQuery",
    "query": "INSERT INTO inbound_package_status_history (inbound_package_id, to_status_code, changed_source, change_notes) VALUES ($1, 'RECEIVED_AT_HUB', 'NALA_BOT', 'Pendaftaran Intake Melalui WhatsApp Nala Bot');",
    "options": {
      "queryReplacement": "=[ \"={{ $json.id }}\" ]"
    }
  },
  "type": "n8n-nodes-base.postgres",
  "typeVersion": 2.6,
  "position": [insertPosX + 250, insertPosY],
  "id": "e456ac4e-0922-482d-8888-af28392a10bf",
  "name": "INJECT HISTORY",
  "credentials": {
    "postgres": {
      "id": "L6VVg71jbu14wSCH",
      "name": "Postgres account"
    }
  }
};
nodes.push(historyNode);

// 4. Add Fallback Node if Hub is Not Found
// Between "CARI HUB" and "Insert Package". 
// Wait, currently N8n connects implicitly via connections (but n8n connections aren't in this node array? ah! connections are stored outside nodes! Wait, where are the "connections"?)
