#!/usr/bin/env python3
"""
Inspect data types in our exported data to understand the boolean fields
"""

import json
import os

def main():
    # Find the latest export file
    export_files = [f for f in os.listdir('.') if f.startswith('local_data_export_') and f.endswith('.json')]
    if not export_files:
        print("❌ No export files found")
        return
    
    # Use the latest file
    latest_file = sorted(export_files)[-1]
    print(f"📁 Analyzing: {latest_file}")
    
    # Load export data
    with open(latest_file, 'r', encoding='utf-8') as f:
        export_data = json.load(f)
    
    print(f"📊 Found {len(export_data)} tables")
    
    # Analyze each table for boolean-like fields
    for table_name, data in export_data.items():
        if not data:
            continue
            
        print(f"\n🔍 Table: {table_name}")
        print(f"   Rows: {len(data)}")
        
        if data:
            # Get first row to analyze field types
            first_row = data[0]
            print(f"   Fields: {list(first_row.keys())}")
            
            # Look for fields that might be booleans (0/1 values)
            boolean_candidates = []
            for field, value in first_row.items():
                if isinstance(value, int) and value in [0, 1]:
                    boolean_candidates.append(field)
            
            if boolean_candidates:
                print(f"   🎯 Potential boolean fields: {boolean_candidates}")
                
                # Show sample values for these fields
                for field in boolean_candidates[:3]:  # Show first 3
                    values = [row.get(field) for row in data[:5]]  # First 5 rows
                    print(f"      {field}: {values}")

if __name__ == "__main__":
    main()
