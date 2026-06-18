import fitz

doc = fitz.open()
page = doc.new_page()

text = """
Market Research: AI Sales Automation
------------------------------------
Industry: B2B SaaS
Target Market Size: $15 Billion by 2028
CAGR: 25.4%

Key Competitors:
1. Apollo.io
2. Outreach.io
3. SalesLoft

Competitive Advantage for 'AutoPitch AI':
While competitors focus on volume, AutoPitch AI focuses on hyper-personalization 
using recent LinkedIn posts and news articles, which increases the positive 
response rate from 2% to 15%.

Target Persona:
- Title: VP of Sales, SDR Manager
- Company Size: 50-500 employees
- Pain point: SDRs spend too much time researching prospects and not enough 
time selling.
"""

# Insert text line by line to handle newlines
y = 50
for line in text.split('\n'):
    page.insert_text(fitz.Point(50, y), line, fontsize=12)
    y += 15

doc.save("test_market_research.pdf")
doc.close()
print("PDF generated successfully.")
