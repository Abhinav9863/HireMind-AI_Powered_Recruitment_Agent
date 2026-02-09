import sqlite3

def migrate():
    try:
        conn = sqlite3.connect('hiremind.db')
        cursor = conn.cursor()
        
        # Add tab_switch_count column
        try:
            cursor.execute("ALTER TABLE application ADD COLUMN tab_switch_count INTEGER DEFAULT 0")
            print("Added tab_switch_count column")
        except sqlite3.OperationalError as e:
            print(f"Skipping tab_switch_count (likely exists): {e}")

        # Add is_disqualified_malpractice column
        try:
            cursor.execute("ALTER TABLE application ADD COLUMN is_disqualified_malpractice BOOLEAN DEFAULT 0")
            print("Added is_disqualified_malpractice column")
        except sqlite3.OperationalError as e:
            print(f"Skipping is_disqualified_malpractice (likely exists): {e}")

        conn.commit()
        conn.close()
        print("Migration successful checked.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
