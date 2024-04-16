
data = [
    {'Name': 'Nadia',
     'Primary Role': 'Mechanical',
     'Secondary Role': 'Hardware',
     },

    {'Name': 'Arun',
     'Primary Role': 'Mechanical',
     'Secondary Role': 'Software',
     },

    {'Name': 'Yi Ren',
     'Primary Role': 'Mechanical',
     'Secondary Role': 'Software',
     },

    {'Name': 'Chor Teng',
     'Primary Role': 'Mechanical',
     'Secondary Role': 'Hardware',
     },

    {'Name': 'Minn',
     'Primary Role': 'Hardware',
     'Secondary Role': 'Mechanical',
     },

    {'Name': 'Hakyung',
     'Primary Role': 'Hardware',
     'Secondary Role': 'Mechanical',
     },

    {'Name': 'Junwei',
     'Primary Role': 'Hardware',
     'Secondary Role': 'Mechanical',
     },

    {'Name': 'Raizee',
     'Primary Role': 'Software',
     'Secondary Role': 'Hardware',
     },

    {'Name': 'Xinzhi',
     'Primary Role': 'Software',
     'Secondary Role': 'Mechanical',
     },

    {'Name': 'Rui Bin',
     'Primary Role': 'Software',
     'Secondary Role': 'Hardware',
     },
]

mechanical_primary_count = 0
mechanical_secondary_count = 0
software_primary_count = 0
software_secondary_count = 0
hardware_primary_count = 0
hardware_secondary_count = 0

markdown_table = "| Name      | Primary Role | Secondary Role |\n| ---------- | ------------ | -------------- |\n"
for row in data:
    markdown_table += f"| {row['Name']} | {row['Primary Role']} | {row['Secondary Role']} |\n"

    if row['Primary Role'] == 'Mechanical':
        mechanical_primary_count += 1
    if row['Secondary Role'] == 'Mechanical':
        mechanical_secondary_count += 1
    if row['Primary Role'] == 'Software':
        software_primary_count += 1
    if row['Secondary Role'] == 'Software':
        software_secondary_count += 1
    if row['Primary Role'] == 'Hardware':
        hardware_primary_count += 1
    if row['Secondary Role'] == 'Hardware':
        hardware_secondary_count += 1

counts_table = "| Role        | Primary Count | Secondary Count |\n| ----------- | ------------- | --------------- |\n"
counts_table += f"| Mechanical  | {mechanical_primary_count}             | {mechanical_secondary_count}               |\n"
counts_table += f"| Software    | {software_primary_count}             | {software_secondary_count}               |\n"
counts_table += f"| Hardware    | {hardware_primary_count}             | {hardware_secondary_count}               |\n"


file_path = 'role_allocation.md'
with open(file_path, 'w') as file:
    file.write("# Role Allocation Table\n\n" + markdown_table + '\n\n\n' + "## Counts Table:\n\n" + counts_table)

print(f"Markdown tables have been saved to {file_path}")
