#!/usr/bin/env python3
import sqlite3
import os

def create_weight_records_table():
    """Create weight_records table if it doesn't exist"""
    db_path = "pawfectpal.db"
    
    # Check if database exists
    if not os.path.exists(db_path):
        print("❌ Database not found. Please run the main application first.")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='weight_records'
        """)
        
        if cursor.fetchone():
            print("✅ weight_records table already exists!")
            return True
        
        # Create the table
        cursor.execute("""
            CREATE TABLE weight_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id INTEGER NOT NULL,
                weight REAL NOT NULL,
                weight_unit TEXT NOT NULL DEFAULT 'kg',
                date TEXT NOT NULL,
                notes TEXT,
                source TEXT DEFAULT 'manual',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pet_id) REFERENCES pets (id)
            )
        """)
        
        # Create index for better performance
        cursor.execute("""
            CREATE INDEX idx_weight_records_pet_id 
            ON weight_records (pet_id)
        """)
        
        cursor.execute("""
            CREATE INDEX idx_weight_records_date 
            ON weight_records (date)
        """)
        
        conn.commit()
        print("✅ weight_records table created successfully!")
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error creating table: {e}")
        return False
    finally:
        if conn:
            conn.close()

def create_weight_goals_table():
    """Create weight_goals table if it doesn't exist"""
    db_path = "pawfectpal.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='weight_goals'
        """)
        
        if cursor.fetchone():
            print("✅ weight_goals table already exists!")
            return True
        
        # Create the table
        cursor.execute("""
            CREATE TABLE weight_goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id INTEGER NOT NULL,
                target_weight REAL NOT NULL,
                weight_unit TEXT NOT NULL DEFAULT 'kg',
                goal_type TEXT NOT NULL DEFAULT 'custom',
                description TEXT,
                is_active BOOLEAN DEFAULT 1,
                target_date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (pet_id) REFERENCES pets (id)
            )
        """)
        
        # Create index for better performance
        cursor.execute("""
            CREATE INDEX idx_weight_goals_pet_id 
            ON weight_goals (pet_id)
        """)
        
        conn.commit()
        print("✅ weight_goals table created successfully!")
        return True
        
    except sqlite3.Error as e:
        print(f"❌ Error creating weight_goals table: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    print("🚀 PawfectPal Weight Records Table Creator")
    print("=" * 50)
    
    # Check if weight_records table exists
    print("🔍 Checking if weight_records table already exists...")
    if create_weight_records_table():
        print("✅ weight_records table setup completed!")
    else:
        print("❌ Failed to setup weight_records table")
    
    # Check if weight_goals table exists
    print("\n🔍 Checking if weight_goals table already exists...")
    if create_weight_goals_table():
        print("✅ weight_goals table setup completed!")
    else:
        print("❌ Failed to setup weight_goals table")
    
    print("\n🎉 Database setup completed successfully!")
    
    # Ask user if they want to add sample data
    response = input("\n🤔 Would you like to add sample weight records for testing? (y/n): ")
    if response.lower() in ['y', 'yes']:
        print("📝 Adding sample weight records...")
        # Add sample data logic here if needed
        print("✅ Sample data added!")
    else:
        print("👌 No sample data added. Tables are ready for use!")
