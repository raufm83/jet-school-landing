import os

def fix_schema(path):
    with open(path, 'rb') as f:
        content = f.read()
    
    clean_content = content.split(b'\x00')[0]
    text = clean_content.decode('utf-8', errors='ignore')
    
    last_brace = text.rfind('}')
    if last_brace != -1:
        text = text[:last_brace+1]
    
    new_model = """

model Advantage {
  id          String           @id @default(auto()) @map("_id") @db.ObjectId
  title       MultilingualText
  description MultilingualText
  order       Int              @default(0)
  isActive    Boolean          @default(true)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}
"""
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text + new_model)

paths = [
    r'c:\Users\amira\OneDrive - Yalova Üniversitesi\Desktop\Jet Teknik Support\jet-school-landing\api\prisma\schema.prisma',
    r'c:\Users\amira\OneDrive - Yalova Üniversitesi\Desktop\Jet Teknik Support\jet-academy-landing\api\prisma\schema.prisma'
]

for p in paths:
    fix_schema(p)
