
content = open(r'c:\xampp\htdocs\pharmacy_billing\frontend\src\pages\Dashboard.tsx', 'r', encoding='utf-8').readlines()
for i, line in enumerate(content):
    if line.count("'") % 2 != 0:
        print(f"Line {i+1}: {line.strip()}")
