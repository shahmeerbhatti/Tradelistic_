"""
Test improved subcategory slot allocation
"""

from collections import Counter

# Simulate different scenarios
test_cases = [
    {"subcategories": {('electronics', 'mobile_phones'): 5}, "name": "1 subcategory (phones)"},
    {"subcategories": {('electronics', 'mobile_phones'): 5, ('electronics', 'laptops'): 3}, "name": "2 subcategories"},
    {"subcategories": {('electronics', 'mobile_phones'): 7, ('electronics', 'laptops'): 4, ('fashion', 'shoes'): 2}, "name": "3 subcategories"},
    {"subcategories": {}, "name": "No subcategories"},
]

for test in test_cases:
    print(f"\n=== Test: {test['name']} ===")
    user_subcategory_counts = Counter(test['subcategories'])
    
    # OLD FORMULA
    old_subcategory_slots = min(6, len(user_subcategory_counts) * 2)
    
    # NEW FORMULA
    new_subcategory_slots = min(8, len(user_subcategory_counts) * 3) if user_subcategory_counts else 0
    
    print(f"Subcategories: {len(user_subcategory_counts)}")
    print(f"OLD formula: min(6, {len(user_subcategory_counts)} * 2) = {old_subcategory_slots} slots")
    print(f"NEW formula: min(8, {len(user_subcategory_counts)} * 3) = {new_subcategory_slots} slots")
    
    if user_subcategory_counts:
        print(f"\nAllocation per subcategory:")
        for (cat, subcat), count in user_subcategory_counts.most_common():
            print(f"  {cat}/{subcat} ({count} interactions) -> 2-3 products")

print("\n" + "="*60)
print("IMPROVEMENT:")
print("- OLD: 1 subcategory → 2 total slots (2 products)")
print("- NEW: 1 subcategory → 3 total slots (2-3 products)")
print("- OLD: 2 subcategories → 4 total slots (2 products each)")
print("- NEW: 2 subcategories → 6 total slots (3 products each)")
print("- OLD: 3+ subcategories → 6 total slots (max)")
print("- NEW: 3+ subcategories → 8 total slots (max, more variety)")
