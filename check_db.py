import sqlite3

try:
    conn = sqlite3.connect('antigravity.db')
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM messages")
    print("Messages count:", cursor.fetchone()[0])
    
    cursor.execute("SELECT * FROM messages ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    print("Recent messages:")
    for row in rows:
        print(row)
        
    cursor.execute("SELECT COUNT(*) FROM notifications")
    print("Notifications count:", cursor.fetchone()[0])
    
    cursor.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    print("Recent notifications:")
    for row in rows:
        print(row)
        
    conn.close()
except Exception as e:
    print("Error:", e)
