"""CSV / PDF export endpoints."""
import csv
import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse

from db import reports as reports_col, requests_col
from auth import get_current_user
from permissions import has_permission

router = APIRouter(prefix='/exports', tags=['exports'])


def _reports_query_for(user, type_filter: Optional[str] = None, dealer_id: Optional[str] = None):
    role = user['role']
    q = {}
    if role in ('owner', 'admin'):
        pass
    elif role == 'manager':
        q = {'$or': [{'author_team_ids': {'$in': user.get('team_ids', [])}}, {'author_id': user['user_id']}]}
    elif role == 'sales_rep':
        q = {'author_id': user['user_id']}
    else:
        q = {'dealer_id': user.get('dealer_id'), 'visible_to_dealer': True}
    if type_filter:
        q['type'] = type_filter
    if dealer_id:
        q['dealer_id'] = dealer_id
    return q


@router.get('/reports.csv')
async def export_reports_csv(
    type: Optional[str] = Query(None),
    dealer_id: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    if not has_permission(user, 'exports.reports'):
        raise HTTPException(403, 'Not allowed to export reports')
    q = _reports_query_for(user, type, dealer_id)
    rows = [r async for r in reports_col.find(q, {'_id': 0, 'attachments': 0}).sort('created_at', -1).limit(5000)]
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        'Report ID', 'Type', 'Title', 'Summary', 'Author', 'Author Role', 'Dealer ID',
        'Farmer', 'Crop', 'Acreage', 'Location', 'Territory', 'Amount (INR)', 'Due at', 'Next Action', 'Created At',
    ])
    for r in rows:
        writer.writerow([
            r.get('report_id'),
            r.get('type'),
            r.get('title'),
            (r.get('summary') or '').replace('\n', ' ')[:500],
            r.get('author_name'),
            r.get('author_role'),
            r.get('dealer_id') or '',
            r.get('farmer_name') or '',
            r.get('crop') or '',
            r.get('acreage') or '',
            r.get('location') or '',
            r.get('territory_id') or '',
            r.get('amount') if r.get('amount') is not None else '',
            r.get('due_at') or '',
            (r.get('next_action') or '').replace('\n', ' ')[:300],
            r.get('created_at'),
        ])
    buf.seek(0)
    filename = f"rex_botanix_reports_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(iter([buf.getvalue()]), media_type='text/csv', headers={'Content-Disposition': f'attachment; filename="{filename}"'})


@router.get('/requests.csv')
async def export_requests_csv(
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    if not has_permission(user, 'exports.requests'):
        raise HTTPException(403, 'Not allowed to export requests')
    role = user['role']
    if role in ('owner', 'admin'):
        q = {}
    elif role == 'manager':
        q = {'$or': [{'author_team_ids': {'$in': user.get('team_ids', [])}}, {'author_id': user['user_id']}]}
    else:
        q = {'author_id': user['user_id']}
    if type:
        q['type'] = type
    if status:
        q['status'] = status
    rows = [r async for r in requests_col.find(q, {'_id': 0, 'attachments': 0}).sort('created_at', -1).limit(5000)]
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        'Request ID', 'Type', 'Title', 'Description', 'Author', 'Amount', 'Start Date', 'End Date',
        'Destination', 'Mode', 'Status', 'Approver', 'Approver Note', 'Created At', 'Approved At',
    ])
    for r in rows:
        writer.writerow([
            r.get('request_id'),
            r.get('type'),
            r.get('title'),
            (r.get('description') or '').replace('\n', ' ')[:500],
            r.get('author_name'),
            r.get('amount') if r.get('amount') is not None else '',
            r.get('start_date') or '',
            r.get('end_date') or '',
            r.get('destination') or '',
            r.get('mode') or '',
            r.get('status'),
            r.get('approver_name') or '',
            (r.get('approver_note') or '').replace('\n', ' ')[:300],
            r.get('created_at'),
            r.get('approved_at') or '',
        ])
    buf.seek(0)
    filename = f"rex_botanix_requests_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(iter([buf.getvalue()]), media_type='text/csv', headers={'Content-Disposition': f'attachment; filename="{filename}"'})


@router.get('/reports.pdf')
async def export_reports_pdf(
    type: Optional[str] = Query(None),
    dealer_id: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    if not has_permission(user, 'exports.reports'):
        raise HTTPException(403, 'Not allowed to export reports')
    q = _reports_query_for(user, type, dealer_id)
    rows = [r async for r in reports_col.find(q, {'_id': 0, 'attachments': 0}).sort('created_at', -1).limit(500)]

    # reportlab
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

    out = io.BytesIO()
    doc = SimpleDocTemplate(out, pagesize=landscape(A4), leftMargin=24, rightMargin=24, topMargin=24, bottomMargin=24, title='Rex Botanix - Reports Export')
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('t', parent=styles['Heading1'], fontSize=16, textColor=colors.HexColor('#1f3d33'))
    muted = ParagraphStyle('m', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#5a6b60'))
    body = ParagraphStyle('b', parent=styles['Normal'], fontSize=8, leading=10)

    elements = []
    elements.append(Paragraph('Rex Botanix — Reports Export', title_style))
    elements.append(Paragraph(f"Generated {datetime.utcnow().strftime('%d %b %Y %H:%M UTC')} · {len(rows)} report(s) · Exported by {user.get('name')} ({user.get('role')})", muted))
    elements.append(Spacer(1, 8))

    data = [['Date', 'Type', 'Title', 'Author', 'Dealer', 'Crop / Farmer', 'Amount (INR)', 'Next Action']]
    for r in rows:
        data.append([
            Paragraph((r.get('created_at') or '')[:10], body),
            Paragraph((r.get('type') or '').replace('_', ' '), body),
            Paragraph((r.get('title') or '')[:90], body),
            Paragraph(r.get('author_name') or '', body),
            Paragraph((r.get('dealer_id') or '')[-8:], body),
            Paragraph(f"{(r.get('crop') or '')} / {(r.get('farmer_name') or '')}", body),
            Paragraph(f"{int(r['amount']):,}" if r.get('amount') not in (None, '') else '', body),
            Paragraph((r.get('next_action') or '')[:90], body),
        ])
    tbl = Table(data, colWidths=[55, 75, 200, 80, 60, 110, 60, 170], repeatRows=1)
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e9efe9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f3d33')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#cfd8d1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fbfaf5')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(tbl)
    doc.build(elements)
    out.seek(0)
    filename = f"rex_botanix_reports_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"
    return StreamingResponse(iter([out.getvalue()]), media_type='application/pdf', headers={'Content-Disposition': f'attachment; filename="{filename}"'})


@router.get('/dashboard.pdf')
async def export_dashboard_pdf(days: int = Query(30, ge=1, le=365), user=Depends(get_current_user)):
    if not has_permission(user, 'exports.dashboard'):
        raise HTTPException(403, 'Not allowed to export dashboard')
    # Re-use dashboard logic
    from routes.dashboard_routes import summary as _summary
    data = await _summary(days=days, user=user)  # type: ignore

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

    out = io.BytesIO()
    doc = SimpleDocTemplate(out, pagesize=A4, leftMargin=28, rightMargin=28, topMargin=28, bottomMargin=28, title='Rex Botanix - Dashboard Export')
    styles = getSampleStyleSheet()
    title = ParagraphStyle('t', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#1f3d33'))
    h2 = ParagraphStyle('h2', parent=styles['Heading2'], fontSize=12, textColor=colors.HexColor('#1f3d33'))
    muted = ParagraphStyle('m', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#5a6b60'))
    body = ParagraphStyle('b', parent=styles['Normal'], fontSize=9, leading=11)

    elements = []
    elements.append(Paragraph('Rex Botanix — Dashboard Snapshot', title))
    elements.append(Paragraph(f"Generated {datetime.utcnow().strftime('%d %b %Y %H:%M UTC')} · Last {days} days · {user.get('name')} ({user.get('role')})", muted))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph('Key performance indicators', h2))
    kpis = data.get('kpis', {})
    kpi_rows = [['Metric', 'Value']]
    labels = [
        ('Total sales (INR)', 'total_amount'),
        ('Reports submitted', 'total_reports'),
        ('Visits', 'total_visits'),
        ('Enquiries', 'total_enquiries'),
        ('Active dealers', 'active_dealers'),
        ('Pending approvals', 'pending_requests'),
    ]
    for label, key in labels:
        val = kpis.get(key, 0)
        if key == 'total_amount':
            val = f"₹ {int(val or 0):,}"
        kpi_rows.append([label, str(val)])
    tbl = Table(kpi_rows, colWidths=[260, 180])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e9efe9')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#cfd8d1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fbfaf5')]),
    ]))
    elements.append(tbl)
    elements.append(Spacer(1, 10))

    if data.get('top_reps'):
        elements.append(Paragraph('Top sales reps', h2))
        trows = [['#', 'Name', 'Reports', 'Amount (INR)']]
        for i, r in enumerate(data['top_reps']):
            trows.append([str(i + 1), r.get('name') or '—', str(r.get('reports') or 0), f"₹ {int(r.get('amount') or 0):,}"])
        t = Table(trows, colWidths=[30, 220, 80, 110])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e9efe9')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#cfd8d1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fbfaf5')]),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 10))

    if data.get('team_breakdown'):
        elements.append(Paragraph('Team breakdown', h2))
        trows = [['Team', 'Reports', 'Amount (INR)']]
        for t in data['team_breakdown']:
            trows.append([t.get('name') or '—', str(t.get('reports') or 0), f"₹ {int(t.get('amount') or 0):,}"])
        tb = Table(trows, colWidths=[260, 80, 120])
        tb.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e9efe9')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#cfd8d1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fbfaf5')]),
        ]))
        elements.append(tb)
        elements.append(Spacer(1, 10))

    elements.append(Paragraph('Recent activity', h2))
    recent_rows = [['Date', 'Type', 'Title', 'Author', 'Amount']]
    for r in data.get('recent', [])[:15]:
        recent_rows.append([
            (r.get('created_at') or '')[:10],
            (r.get('type') or '').replace('_', ' '),
            Paragraph((r.get('title') or '')[:60], body),
            r.get('author_name') or '',
            f"₹ {int(r['amount']):,}" if r.get('amount') not in (None, '') else '',
        ])
    rec = Table(recent_rows, colWidths=[60, 80, 220, 100, 80])
    rec.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e9efe9')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#cfd8d1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fbfaf5')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(rec)

    doc.build(elements)
    out.seek(0)
    filename = f"rex_botanix_dashboard_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.pdf"
    return StreamingResponse(iter([out.getvalue()]), media_type='application/pdf', headers={'Content-Disposition': f'attachment; filename="{filename}"'})
