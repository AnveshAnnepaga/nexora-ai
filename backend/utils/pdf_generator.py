import os
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.colors import HexColor

def generate_pdf(idea_data: dict, report_type: str, output_path: str):
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle('CustomTitle', parent=styles['Title'], fontSize=24, spaceAfter=20, textColor=HexColor('#1E3A8A'))
    h1_style = ParagraphStyle('CustomH1', parent=styles['Heading1'], fontSize=18, spaceAfter=10, spaceBefore=15, textColor=HexColor('#2563EB'))
    h2_style = ParagraphStyle('CustomH2', parent=styles['Heading2'], fontSize=14, spaceAfter=8, spaceBefore=12)
    normal_style = styles['Normal']

    story = []

    title_map = {
        "pitch_deck": "Pitch Deck Analysis",
        "swot": "SWOT Analysis Report",
        "competitor": "Competitor Analysis Report",
        "revenue": "Revenue Model Evaluation",
        "risk": "Risk Assessment Report",
        "roadmap": "Business Roadmap",
        "business_model": "Business Model Canvas",
        "full": "Full Investor-Ready Report"
    }
    
    report_title = title_map.get(report_type, "Analysis Report")
    story.append(Paragraph(report_title, title_style))
    story.append(Paragraph(f"Startup Name: {idea_data.get('title', 'Unknown')}", h2_style))
    story.append(Spacer(1, 20))

    data_to_render = idea_data.get("reports_json", {})
    if isinstance(data_to_render, str):
        try:
            data_to_render = json.loads(data_to_render)
        except:
            data_to_render = {}

    def format_dict(d, level=1):
        lines = []
        for k, v in d.items():
            if isinstance(v, dict):
                lines.append(Paragraph(f"<b>{k.replace('_', ' ').title()}</b>", h2_style if level==1 else normal_style))
                lines.extend(format_dict(v, level+1))
            elif isinstance(v, list):
                lines.append(Paragraph(f"<b>{k.replace('_', ' ').title()}</b>", h2_style if level==1 else normal_style))
                for item in v:
                    if isinstance(item, dict):
                        lines.extend(format_dict(item, level+1))
                    else:
                        lines.append(Paragraph(f"• {str(item)}", normal_style))
            else:
                lines.append(Paragraph(f"<b>{k.replace('_', ' ').title()}:</b> {str(v)}", normal_style))
        return lines

    if report_type == "swot":
        content = data_to_render.get("swot", {})
    elif report_type == "competitor":
        content = data_to_render.get("competitor_intel", {})
    elif report_type == "revenue":
        content = data_to_render.get("subscription_plan", {})
    elif report_type == "risk":
        content = data_to_render.get("risk_assessment", {})
    elif report_type == "roadmap":
        content = data_to_render.get("roadmap", {})
    elif report_type == "pitch_deck":
        content = data_to_render.get("pitch_deck", {})
    elif report_type == "business_model":
        content = data_to_render.get("business_model_eval", {})
    else:
        # Full
        content = data_to_render

    story.extend(format_dict(content))
    
    doc.build(story)
    return output_path
