import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def check_files(dir_path):
    findings = []
    mongo_ops = {'$gte', '$lte', '$gt', '$lt', '$eq', '$ne', '$in', '$nin', '$or', '$and', '$not', '$nor',
                 '$set', '$unset', '$inc', '$mul', '$rename', '$min', '$max', '$currentDate',
                 '$match', '$group', '$sort', '$project', '$lookup', '$unwind', '$limit', '$skip',
                 '$sum', '$avg', '$push', '$addToSet', '$pop', '$pull', '$pullAll', '$slice',
                 '$regex', '$options', '$type', '$exists', '$expr'}

    for root, _, files in os.walk(dir_path):
        if any(skip in root for skip in ['node_modules', '.venv', 'dist', '.git', '__pycache__', 'package-lock.json', '.gemini']):
            continue
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.json', '.md')):
                if file in ['package-lock.json', 'find_currency.py', 'walkthrough.md', 'implementation_plan.md']:
                    continue
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    for i, line in enumerate(f, 1):
                        # Check DollarSign
                        if 'DollarSign' in line:
                            findings.append((filepath, i, 'DollarSign', line.strip()))
                            continue
                        # Check USD or US Dollar
                        if re.search(r'\b(USD|dollars?)\b', line, re.IGNORECASE):
                            findings.append((filepath, i, 'USD/dollar', line.strip()))
                            continue
                        # Check $ currency
                        if '$' in line:
                            # ignore bcrypt hash or mocks
                            if '$2b$' in line or '$MockHash' in line:
                                continue
                            # check if it's a currency like $50, $0, ($), etc.
                            line_no_template = re.sub(r'\$\{[^}]*\}', '', line)
                            if re.search(r'(\$\s*\d+|\(\s*\$\s*\)|\$\s*\/|\b\$\b|>\s*\$\s*<|"\$")', line_no_template):
                                findings.append((filepath, i, 'currency $', line.strip()))
                            elif re.search(r'(\$\`|\`\s*\$|\+\s*\'\$\'|\+\s*"\$")', line_no_template):
                                findings.append((filepath, i, 'currency $', line.strip()))

    return findings

results = check_files('c:/Users/Lenovo/Desktop/SMARTFIN')
print(f"Total findings: {len(results)}")
for path, line_no, ftype, content in results:
    rel = os.path.relpath(path, 'c:/Users/Lenovo/Desktop/SMARTFIN')
    print(f"[{ftype}] {rel}:{line_no} -> {content}")
