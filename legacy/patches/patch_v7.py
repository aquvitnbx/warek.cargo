import json
import re

with open('v7_nodes.json', 'r') as f:
    text = f.read()

text = text.replace("- Jakarta\\n- Surabaya\\n- Makassar", "(Saat ini hanya melayani penerimaan via Hub SURABAYA)")

old_addr = r"'Alamat Hub ' \+ \$\('Unwrap JSON AI'\).item.json.extracted_data.hub_selection \+ ':\\\\n' \+ \(\$\('Unwrap JSON AI'\).item.json.extracted_data.hub_selection === 'JAKARTA' \? 'Pergudangan Angke Blok N' : \$\('Unwrap JSON AI'\).item.json.extracted_data.hub_selection === 'SURABAYA' \? 'Margomulyo Permai' : 'KIMA Gudang C'\)"
new_addr = r"'*Alamat Hub Surabaya:*\\nAtas Nama : ' + ($('Unwrap JSON AI').item.json.extracted_data.customer_name ? $('Unwrap JSON AI').item.json.extracted_data.customer_name : 'Nama Anda') + ', Ibu Dinda\\nTlpn : 08113030523\\nPerumahaan permata wiyung regency\\nKav. 25\\nJL. Raya wiyung pratama\\nKec. Wiyung kota surabaya'"

text = re.sub(old_addr, new_addr, text)

with open('v7_nodes_patched.json', 'w') as f:
    f.write(text)
