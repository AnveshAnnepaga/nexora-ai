import fitz

doc = fitz.open()
page = doc.new_page()

text = """
========================================
MEDISYNC AI — CONFIDENTIAL PITCH DECK
========================================

1. PROBLEM:
Doctors spend an average of 15 hours a week manually typing notes into
Electronic Health Records (EHRs) like Epic and Cerner. This administrative 
burden is the leading cause of physician burnout and costs the healthcare 
system billions in lost efficiency.

2. SOLUTION:
MediSync AI is an ambient voice AI that listens to patient consultations 
securely, automatically transcribes the medical conversation, extracts 
the correct ICD-10 and CPT billing codes, and injects the notes directly 
into the EHR via a secure RPA Chrome Extension.

3. MARKET OPPORTUNITY:
- Total Addressable Market (TAM): $12 Billion (US Healthcare IT)
- Serviceable Addressable Market (SAM): $3.5 Billion (Private Clinics)
- Target Growth: Aiming to capture 5% of SAM in 3 years ($175M ARR)

4. COMPETITIVE LANDSCAPE:
- Nuance DAX: Enterprise-focused, expensive, 6-month deployment.
- Abridge: API-based, difficult to integrate with legacy web EHRs.
- MediSync AI (Us): Plug-and-play Chrome extension, zero IT integration 
  required, 5-minute setup time.

5. BUSINESS MODEL & PRICING:
B2B SaaS Subscription
Price: $199 / month per doctor.
LTV (Estimated): $7,000 | CAC (Estimated): $500
Gross Margin: 85%

6. THE ASK:
Raising $2.5M Seed Round to expand our engineering team and fund 
go-to-market strategies targeting independent dermatology and physical 
therapy clinics.
"""

# Insert text line by line to handle newlines
y = 50
for line in text.split('\n'):
    page.insert_text(fitz.Point(50, y), line, fontsize=11, fontname="helv")
    y += 15

doc.save("medisync_pitchdeck.pdf")
doc.close()
print("Successfully generated medisync_pitchdeck.pdf!")
