"""
SMARTFIN Professional PDF Report Generation Engine.

ARCHITECTURE:
Constructs an executive, multi-page monthly financial statement PDF
using ReportLab PlatyPus with custom fintech design aesthetics:
- Brand styling: Navy (#0B0F19), Slate (#1E293B), Emerald (#10B981)
- 11 comprehensive financial sections
- Running header and page numbering (Page X of Y)
- In-memory io.BytesIO() compilation
"""

import io
from typing import Any, Dict, List
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
import os
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

PDF_FONT_REGULAR = "Helvetica"
PDF_FONT_BOLD = "Helvetica-Bold"

# Register TrueType fonts that support Indian Rupee symbol (₹ / U+20B9)
_font_candidates = [
    ("C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/arialbd.ttf"),
    ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/segoeuib.ttf"),
    ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
]

for reg_path, bold_path in _font_candidates:
    if os.path.exists(reg_path) and os.path.exists(bold_path):
        try:
            pdfmetrics.registerFont(TTFont("SmartFinRegular", reg_path))
            pdfmetrics.registerFont(TTFont("SmartFinBold", bold_path))
            PDF_FONT_REGULAR = "SmartFinRegular"
            PDF_FONT_BOLD = "SmartFinBold"
            break
        except Exception:
            pass

# Palette constants
PRIMARY_DARK = colors.HexColor('#0B0F19')
SLATE_HEADER = colors.HexColor('#1E293B')
SLATE_TEXT = colors.HexColor('#334155')
SLATE_MUTED = colors.HexColor('#64748B')
SLATE_BORDER = colors.HexColor('#CBD5E1')
SLATE_BG_LIGHT = colors.HexColor('#F8FAFC')
EMERALD_BRAND = colors.HexColor('#10B981')
EMERALD_LIGHT = colors.HexColor('#ECFDF5')
AMBER_WARNING = colors.HexColor('#F59E0B')
ROSE_DANGER = colors.HexColor('#EF4444')
CYAN_ACCENT = colors.HexColor('#06B6D4')


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for dynamic 'Page X of Y' numbering and running headers."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count: int):
        self.saveState()

        # Running Header on pages > 1
        if self._pageNumber > 1:
            self.setFont(PDF_FONT_BOLD, 8)
            self.setFillColor(EMERALD_BRAND)
            self.drawString(40, 755, "SMARTFIN")
            self.setFont(PDF_FONT_REGULAR, 8)
            self.setFillColor(SLATE_MUTED)
            self.drawString(95, 755, "|   Executive Monthly Financial Statement")

            self.setStrokeColor(SLATE_BORDER)
            self.setLineWidth(0.5)
            self.line(40, 747, 572, 747)

        # Running Footer on all pages
        self.setStrokeColor(SLATE_BORDER)
        self.setLineWidth(0.5)
        self.line(40, 38, 572, 38)

        self.setFont(PDF_FONT_REGULAR, 8)
        self.setFillColor(SLATE_MUTED)
        self.drawString(40, 26, "CONFIDENTIAL  •  Educational & Planning Document Only")

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 26, page_str)

        self.restoreState()


def _format_currency(amount: float, symbol: str = "₹") -> str:
    """Format monetary amount according to Indian numbering system (Lakhs, Crores)."""
    try:
        val = float(amount)
        is_negative = val < 0
        val = abs(val)
        formatted_2dec = f"{val:.2f}"
        int_part, dec_part = formatted_2dec.split(".")
        if len(int_part) > 3:
            last3 = int_part[-3:]
            rest = int_part[:-3]
            groups = []
            while len(rest) > 2:
                groups.insert(0, rest[-2:])
                rest = rest[:-2]
            if rest:
                groups.insert(0, rest)
            int_str = ",".join(groups) + "," + last3
        else:
            int_str = int_part
        prefix = "-" if is_negative else ""
        return f"{prefix}{symbol}{int_str}.{dec_part}"
    except Exception:
        return f"{symbol}0.00"


def build_monthly_financial_pdf(data: Dict[str, Any]) -> bytes:
    """
    Generate professional, publication-quality monthly financial statement PDF.
    Returns in-memory PDF binary bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=46,
        bottomMargin=46,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName=PDF_FONT_BOLD,
        fontSize=20,
        leading=24,
        textColor=PRIMARY_DARK,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName=PDF_FONT_REGULAR,
        fontSize=10,
        leading=13,
        textColor=SLATE_MUTED,
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName=PDF_FONT_BOLD,
        fontSize=12,
        leading=16,
        textColor=PRIMARY_DARK,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName=PDF_FONT_REGULAR,
        fontSize=9,
        leading=13,
        textColor=SLATE_TEXT,
    )

    body_bold = ParagraphStyle(
        'ReportBodyBold',
        parent=styles['Normal'],
        fontName=PDF_FONT_BOLD,
        fontSize=9,
        leading=13,
        textColor=PRIMARY_DARK,
    )

    callout_text = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName=PDF_FONT_REGULAR,
        fontSize=8.5,
        leading=12.5,
        textColor=SLATE_TEXT,
    )

    story = []

    user_ov = data.get("user_overview", {})
    fin_sum = data.get("financial_summary", {})
    health = data.get("financial_health_score", {})
    spending = data.get("spending_analysis", {})
    emergency = data.get("emergency_fund", {})
    goals = data.get("goals", {})
    investments = data.get("investments", {})
    debts = data.get("debts", {})
    net_worth = data.get("net_worth", {})
    budgets = data.get("budgets", {})
    ai = data.get("ai_insights", {})

    currency_sym = user_ov.get("currency_symbol", "₹")

    # =========================================================================
    # 1. HEADER & EXECUTIVE COVER BANNER
    # =========================================================================
    header_data = [
        [
            Paragraph("<b>SMARTFIN</b> <font color='#10B981'>FINANCIAL INTELLIGENCE</font>", title_style),
            Paragraph(f"<b>STATEMENT PERIOD:</b> {user_ov.get('period_name', 'Current Month')}", subtitle_style),
        ],
        [
            Paragraph(f"<b>Account Holder:</b> {user_ov.get('name', 'Valued User')} ({user_ov.get('email', '')})", subtitle_style),
            Paragraph(f"<b>Generated:</b> {user_ov.get('generated_at', '')}", subtitle_style),
        ],
    ]
    header_table = Table(header_data, colWidths=[330, 202])
    header_table.setStyle(
        TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
        ])
    )
    story.append(header_table)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=EMERALD_BRAND, spaceAfter=12))

    # =========================================================================
    # 2. FINANCIAL SUMMARY & HEALTH SCORE (4-METRIC EXECUTIVE GRID)
    # =========================================================================
    story.append(Paragraph("1. Executive Cashflow & Financial Health Overview", section_heading))

    score_val = health.get("score", 0)
    risk_label = health.get("risk_level", "Moderate")
    score_color = '#10B981' if score_val >= 80 else ('#F59E0B' if score_val >= 60 else '#EF4444')

    grid_data = [
        [
            Paragraph("<b>Monthly Income</b>", body_style),
            Paragraph("<b>Monthly Expenses</b>", body_style),
            Paragraph("<b>Net Monthly Surplus</b>", body_style),
            Paragraph("<b>Savings Rate</b>", body_style),
            Paragraph("<b>Health Score</b>", body_style),
        ],
        [
            Paragraph(f"<font size=11 color='#10B981'><b>{_format_currency(fin_sum.get('income', 0), currency_sym)}</b></font>", body_style),
            Paragraph(f"<font size=11 color='#334155'><b>{_format_currency(fin_sum.get('expenses', 0), currency_sym)}</b></font>", body_style),
            Paragraph(f"<font size=11 color='#10B981'><b>{_format_currency(fin_sum.get('surplus', 0), currency_sym)}</b></font>", body_style),
            Paragraph(f"<font size=11 color='#06B6D4'><b>{fin_sum.get('savings_rate', 0):.1f}%</b></font>", body_style),
            Paragraph(f"<font size=12 color='{score_color}'><b>{score_val}/100</b></font><br/><font size=7 color='#64748B'>{risk_label}</font>", body_style),
        ],
    ]
    grid_table = Table(grid_data, colWidths=[106, 106, 106, 106, 108])
    grid_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), SLATE_BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.75, SLATE_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ])
    )
    story.append(grid_table)
    story.append(Spacer(1, 8))

    # 5-Pillar Breakdown Table
    pillars = health.get("pillars", [])
    if pillars:
        pillar_rows = [
            [
                Paragraph("<b>Evaluation Pillar</b>", body_bold),
                Paragraph("<b>Score / Max</b>", body_bold),
                Paragraph("<b>Status</b>", body_bold),
                Paragraph("<b>Strategic Observation</b>", body_bold),
            ]
        ]
        for p in pillars:
            p_name = p.get("name", "")
            p_score = f"{p.get('score', 0):.1f} / {p.get('max_score', 0):.0f}"
            p_status = p.get("status", "Good")
            p_insight = p.get("insight", "")
            pillar_rows.append([
                Paragraph(p_name, body_style),
                Paragraph(p_score, body_style),
                Paragraph(f"<b>{p_status}</b>", body_style),
                Paragraph(p_insight, callout_text),
            ])

        pillar_table = Table(pillar_rows, colWidths=[110, 75, 75, 272])
        pillar_table.setStyle(
            TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), SLATE_HEADER),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
                ('TOPPADDING', (0, 0), (-1, -1), 3.5),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
                ('BOX', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, SLATE_BG_LIGHT]),
            ])
        )
        # Fix text color of table header
        for col_idx in range(4):
            pillar_rows[0][col_idx].style.textColor = colors.white
        story.append(pillar_table)

    story.append(Spacer(1, 10))

    # =========================================================================
    # 3. AI-GENERATED EXECUTIVE SYNTHESIS
    # =========================================================================
    story.append(Paragraph("2. Gemini AI Strategic Financial Insights", section_heading))

    ai_summary_text = ai.get("summary", "Monthly financial posture remains stable.")
    ai_box_data = [
        [
            Paragraph("<b>Executive Synthesis & Advisor Commentary:</b><br/>" + ai_summary_text, callout_text)
        ]
    ]
    ai_table = Table(ai_box_data, colWidths=[532])
    ai_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), EMERALD_LIGHT),
            ('BOX', (0, 0), (-1, -1), 1, EMERALD_BRAND),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ])
    )
    story.append(ai_table)
    story.append(Spacer(1, 6))

    # Highlights & Improvement Columns
    highlights = ai.get("highlights", [])
    areas_for_imp = ai.get("areas_for_improvement", [])
    hl_text = "<br/>".join([f"• {h}" for h in highlights[:3]]) if highlights else "• Consistent income deposits maintained."
    ai_imp_text = "<br/>".join([f"• {a}" for a in areas_for_imp[:2]]) if areas_for_imp else "• Expand emergency reserve buffer."

    bullets_data = [
        [
            Paragraph("<b>Key Milestones & Strengths:</b><br/>" + hl_text, callout_text),
            Paragraph("<b>Areas for Tactical Focus:</b><br/>" + ai_imp_text, callout_text),
        ]
    ]
    bullets_table = Table(bullets_data, colWidths=[262, 262])
    bullets_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), SLATE_BG_LIGHT),
            ('BACKGROUND', (1, 0), (1, 0), SLATE_BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ])
    )
    story.append(bullets_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # 4. SPENDING BREAKDOWN & BUDGET USAGE
    # =========================================================================
    story.append(Paragraph("3. Monthly Outflows & Category Budget Discipline", section_heading))

    categories = spending.get("categories", [])
    budget_items = budgets.get("items", [])
    total_spent = spending.get("total_spent", 0.0)

    spend_rows = [
        [
            Paragraph("<b>Category</b>", body_bold),
            Paragraph("<b>Amount Spent</b>", body_bold),
            Paragraph("<b>% of Total</b>", body_bold),
            Paragraph("<b>Monthly Budget</b>", body_bold),
            Paragraph("<b>Adherence Status</b>", body_bold),
        ]
    ]
    spend_rows[0][0].style.textColor = colors.white
    spend_rows[0][1].style.textColor = colors.white
    spend_rows[0][2].style.textColor = colors.white
    spend_rows[0][3].style.textColor = colors.white
    spend_rows[0][4].style.textColor = colors.white

    if categories:
        for c in categories[:6]:
            cat_name = c.get("category", "")
            amt = c.get("amount", 0.0)
            pct = (amt / total_spent * 100) if total_spent > 0 else 0.0

            # Find matching budget
            matched_b = next((b for b in budget_items if b.get("category", "").lower() == cat_name.lower()), None)
            limit_str = _format_currency(matched_b.get("monthly_limit", 0), currency_sym) if matched_b else "Unbudgeted"
            status_str = matched_b.get("status", "Safe") if matched_b else "—"

            spend_rows.append([
                Paragraph(cat_name, body_style),
                Paragraph(_format_currency(amt, currency_sym), body_style),
                Paragraph(f"{pct:.1f}%", body_style),
                Paragraph(limit_str, body_style),
                Paragraph(f"<b>{status_str}</b>", body_style),
            ])
    else:
        spend_rows.append([
            Paragraph("No recorded expenses this period.", body_style),
            Paragraph("—", body_style),
            Paragraph("—", body_style),
            Paragraph("—", body_style),
            Paragraph("—", body_style),
        ])

    spend_table = Table(spend_rows, colWidths=[120, 100, 75, 115, 122])
    spend_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), SLATE_HEADER),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('BOX', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, SLATE_BG_LIGHT]),
        ])
    )
    story.append(spend_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # 5. EMERGENCY RESERVE & ACTIVE GOALS
    # =========================================================================
    story.append(Paragraph("4. Emergency Buffer & Financial Goals Velocity", section_heading))

    em_savings = emergency.get("current_savings", 0.0)
    em_target = emergency.get("target_amount", 0.0)
    em_runway = emergency.get("months_covered", 0.0)
    em_status = emergency.get("status", "Adequate")

    em_summary_data = [
        [
            Paragraph(f"<b>Current Reserve:</b> {_format_currency(em_savings, currency_sym)}", body_style),
            Paragraph(f"<b>6-Month Target:</b> {_format_currency(em_target, currency_sym)}", body_style),
            Paragraph(f"<b>Survival Runway:</b> <b>{em_runway:.1f} Months</b>", body_style),
            Paragraph(f"<b>Reserve Status:</b> <b>{em_status}</b>", body_style),
        ]
    ]
    em_summary_table = Table(em_summary_data, colWidths=[133, 133, 133, 133])
    em_summary_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), SLATE_BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ])
    )
    story.append(em_summary_table)
    story.append(Spacer(1, 6))

    # Goals Table
    goal_items = goals.get("items", [])
    if goal_items:
        g_rows = [
            [
                Paragraph("<b>Goal Name</b>", body_bold),
                Paragraph("<b>Target</b>", body_bold),
                Paragraph("<b>Saved</b>", body_bold),
                Paragraph("<b>Progress</b>", body_bold),
                Paragraph("<b>Monthly Req.</b>", body_bold),
                Paragraph("<b>Status</b>", body_bold),
            ]
        ]
        g_rows[0][0].style.textColor = colors.white
        g_rows[0][1].style.textColor = colors.white
        g_rows[0][2].style.textColor = colors.white
        g_rows[0][3].style.textColor = colors.white
        g_rows[0][4].style.textColor = colors.white
        g_rows[0][5].style.textColor = colors.white

        for g in goal_items[:5]:
            on_track_str = "On Track" if g.get("on_track") else "Needs Attention"
            g_rows.append([
                Paragraph(g.get("goal_name", ""), body_style),
                Paragraph(_format_currency(g.get("target_amount", 0), currency_sym), body_style),
                Paragraph(_format_currency(g.get("current_saved", 0), currency_sym), body_style),
                Paragraph(f"{g.get('progress_percentage', 0):.1f}%", body_style),
                Paragraph(_format_currency(g.get("monthly_required", 0), currency_sym), body_style),
                Paragraph(f"<b>{on_track_str}</b>", body_style),
            ])

        g_table = Table(g_rows, colWidths=[120, 80, 80, 72, 95, 85])
        g_table.setStyle(
            TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), SLATE_HEADER),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
                ('TOPPADDING', (0, 0), (-1, -1), 3.5),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
                ('BOX', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, SLATE_BG_LIGHT]),
            ])
        )
        story.append(g_table)

    story.append(Spacer(1, 10))

    # =========================================================================
    # 6. NET WORTH, ASSETS & DEBT MANAGEMENT
    # =========================================================================
    story.append(Paragraph("5. Balance Sheet Posture & Debt Obligations", section_heading))

    assets_val = net_worth.get("total_assets", 0.0)
    liab_val = net_worth.get("total_liabilities", 0.0)
    nw_val = net_worth.get("net_worth", 0.0)

    nw_summary_data = [
        [
            Paragraph(f"<b>Total Assets:</b> {_format_currency(assets_val, currency_sym)}", body_style),
            Paragraph(f"<b>Total Liabilities:</b> {_format_currency(liab_val, currency_sym)}", body_style),
            Paragraph(f"<b>Total Net Worth:</b> <font color='#10B981'><b>{_format_currency(nw_val, currency_sym)}</b></font>", body_style),
        ]
    ]
    nw_table = Table(nw_summary_data, colWidths=[177, 177, 178])
    nw_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), SLATE_BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ])
    )
    story.append(nw_table)
    story.append(Spacer(1, 6))

    # Active Debts Table
    debt_items = debts.get("items", [])
    if debt_items:
        d_rows = [
            [
                Paragraph("<b>Debt Instrument</b>", body_bold),
                Paragraph("<b>Principal</b>", body_bold),
                Paragraph("<b>Remaining Balance</b>", body_bold),
                Paragraph("<b>Interest Rate</b>", body_bold),
                Paragraph("<b>Min. Monthly</b>", body_bold),
            ]
        ]
        d_rows[0][0].style.textColor = colors.white
        d_rows[0][1].style.textColor = colors.white
        d_rows[0][2].style.textColor = colors.white
        d_rows[0][3].style.textColor = colors.white
        d_rows[0][4].style.textColor = colors.white

        for d in debt_items[:5]:
            d_rows.append([
                Paragraph(d.get("debt_name", ""), body_style),
                Paragraph(_format_currency(d.get("principal", 0), currency_sym), body_style),
                Paragraph(_format_currency(d.get("remaining_balance", 0), currency_sym), body_style),
                Paragraph(f"{d.get('interest_rate', 0)}% p.a.", body_style),
                Paragraph(_format_currency(d.get("minimum_payment", 0), currency_sym), body_style),
            ])

        d_table = Table(d_rows, colWidths=[140, 95, 105, 95, 97])
        d_table.setStyle(
            TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), SLATE_HEADER),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
                ('TOPPADDING', (0, 0), (-1, -1), 3.5),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
                ('BOX', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, SLATE_BG_LIGHT]),
            ])
        )
        story.append(d_table)

    story.append(Spacer(1, 10))

    # =========================================================================
    # 7. INVESTMENTS & 10-YEAR COMPOUNDING TRAJECTORY
    # =========================================================================
    story.append(Paragraph("6. Wealth Compounding & SIP Projections", section_heading))

    monthly_inv = investments.get("monthly_investment", 0.0)
    projections = investments.get("projections", {})

    inv_rows = [
        [
            Paragraph("<b>Monthly Allocation</b>", body_bold),
            Paragraph("<b>1-Year Projection</b>", body_bold),
            Paragraph("<b>3-Year Projection</b>", body_bold),
            Paragraph("<b>5-Year Projection</b>", body_bold),
            Paragraph("<b>10-Year Projection</b>", body_bold),
        ],
        [
            Paragraph(_format_currency(monthly_inv, currency_sym), body_style),
            Paragraph(_format_currency(projections.get("1_year", monthly_inv * 12), currency_sym), body_style),
            Paragraph(_format_currency(projections.get("3_year", monthly_inv * 36), currency_sym), body_style),
            Paragraph(_format_currency(projections.get("5_year", monthly_inv * 60), currency_sym), body_style),
            Paragraph(f"<font color='#10B981'><b>{_format_currency(projections.get('10_year', monthly_inv * 120), currency_sym)}</b></font>", body_style),
        ],
    ]
    inv_rows[0][0].style.textColor = colors.white
    inv_rows[0][1].style.textColor = colors.white
    inv_rows[0][2].style.textColor = colors.white
    inv_rows[0][3].style.textColor = colors.white
    inv_rows[0][4].style.textColor = colors.white

    inv_table = Table(inv_rows, colWidths=[106, 106, 106, 106, 108])
    inv_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), SLATE_HEADER),
            ('BACKGROUND', (0, 1), (-1, 1), SLATE_BG_LIGHT),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('BOX', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ])
    )
    story.append(inv_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # 8. RESPONSIBLE FINANCE DISCLAIMER
    # =========================================================================
    disclaimer_text = (
        "<b>LEGAL & COMPLIANCE NOTICE:</b> This monthly financial statement is automatically compiled by SMARTFIN "
        "using authenticated ledger transactions and deterministic algorithms. All insights and projections are generated "
        "solely for personal budgeting, educational tracking, and scenario exploration. SMARTFIN is not an authorized "
        "brokerage or chartered tax authority. Consult a certified financial planner (CFP) for bespoke advisory."
    )
    disc_data = [[Paragraph(disclaimer_text, callout_text)]]
    disc_table = Table(disc_data, colWidths=[532])
    disc_table.setStyle(
        TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
            ('BOX', (0, 0), (-1, -1), 0.5, SLATE_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ])
    )
    story.append(disc_table)

    # Build PDF with dynamic NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
