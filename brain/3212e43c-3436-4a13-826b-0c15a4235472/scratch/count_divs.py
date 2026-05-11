
content = open(r'c:\xampp\htdocs\pharmacy_billing\frontend\src\pages\admin\SystemHealth.tsx', 'r', encoding='utf-8').read()
opening = content.count('<div')
closing = content.count('</div>')
print(f"Opening <div: {opening}")
print(f"Closing </div>: {closing}")
