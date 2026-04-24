import psycopg2
import os

DB_CONN = "postgresql://neondb_owner:npg_q6y5BvYmWxcZ@ep-noisy-hall-a1m45zhm-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

def migrate():
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()
    
    try:
        # 1. Insert Master Data
        print("Inserting AWAITING_HUB_RECEIPT to ref_package_statuses...")
        cur.execute("""
            INSERT INTO ref_package_statuses (code, name, description, sort_order) 
            VALUES ('AWAITING_HUB_RECEIPT', 'Data Telah Diterima, Menunggu FIsik Tiba', 'Pre-manifest declaration dari kustomer, fisik belum tiba di hub', 15)
            ON CONFLICT (code) DO NOTHING;
        """)
        
        # 2. Backfill status history (NALA_BOT)
        print("Backfilling inbound_package_status_history...")
        cur.execute("""
            UPDATE inbound_package_status_history
            SET to_status_code = 'AWAITING_HUB_RECEIPT'
            WHERE to_status_code = 'RECEIVED_AT_HUB'
              AND changed_source = 'NALA_BOT'
              AND change_notes ILIKE '%WhatsApp Nala Bot%';
        """)
        history_updated = cur.rowcount
        print(f"Updated {history_updated} history records.")

        # 3. Backfill inbound_packages
        # Hanya ubah jika paket belum ada record history lain selain NALA_BOT
        # dan received_at IS NULL
        print("Backfilling inbound_packages...")
        cur.execute("""
            UPDATE inbound_packages p
            SET package_status_code = 'AWAITING_HUB_RECEIPT'
            WHERE package_status_code = 'RECEIVED_AT_HUB'
              AND received_at IS NULL
              AND EXISTS (
                  SELECT 1 
                  FROM inbound_package_status_history h 
                  WHERE h.inbound_package_id = p.id 
                    AND h.changed_source = 'NALA_BOT'
              )
              AND NOT EXISTS (
                  SELECT 1
                  FROM inbound_package_status_history h2
                  WHERE h2.inbound_package_id = p.id
                    AND h2.changed_source != 'NALA_BOT'
              );
        """)
        packages_updated = cur.rowcount
        print(f"Updated {packages_updated} packages.")

        conn.commit()
        print("Migration successful.")
    except Exception as e:
        conn.rollback()
        print("Error during migration:", e)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate()
