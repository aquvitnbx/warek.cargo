import json

with open('v7_nodes_patched.json', 'r') as f:
    text = f.read()

text_sql = text.replace("'", "''")
sql = f"UPDATE workflow_entity SET nodes = '{text_sql}'::json, active=true WHERE id='YjfuJinrlf5INjSZ';\nUPDATE workflow_entity SET active=false WHERE id='HVAsREvXXKB1oVro';"

with open('update.sql', 'w') as f:
    f.write(sql)
