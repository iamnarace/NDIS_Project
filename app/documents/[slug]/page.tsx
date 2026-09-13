import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { ALL_CONTROLLED_DOCUMENTS } from '@/lib/services/governanceDocuments';
import { ShieldCheck, Calendar, FileText, ArrowLeft, Printer, CheckCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const targetUrl = `/documents/${slug}`;
  const doc = ALL_CONTROLLED_DOCUMENTS.find(
    (d) => d.source_template_url === targetUrl || d.document_code.toLowerCase() === slug.toLowerCase()
  );

  if (!doc) {
    return { title: 'Document Not Found | Opus Care Support Services' };
  }

  return {
    title: `${doc.title} | Controlled Governance Documents | Opus Care Support Services`,
    description: doc.change_summary || `Official Opus Care controlled operational policy: ${doc.title}`,
  };
}

export default async function ControlledDocumentPage({ params }: PageProps) {
  const { slug } = await params;
  const targetUrl = `/documents/${slug}`;

  // Check fallback static definition first
  const staticDoc = ALL_CONTROLLED_DOCUMENTS.find(
    (d) => d.source_template_url === targetUrl || d.document_code.toLowerCase() === slug.toLowerCase()
  );

  // Attempt database query for latest controlled document record
  const supabase = createAdminClient();
  let dbDoc: any = null;

  if (supabase) {
    const { data } = await supabase
      .from('controlled_documents')
      .select('*')
      .or(`source_template_url.eq.${targetUrl},document_code.ilike.${slug}`)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    dbDoc = data;
  }

  const doc = dbDoc || staticDoc;

  if (!doc) {
    notFound();
  }

  // Format content markdown into readable sections if structured markdown exists
  const rawContent: string = doc.content_markdown || '';
  const paragraphs = rawContent
    ? rawContent.split('\n\n').filter((p: string) => p.trim().length > 0)
    : [doc.change_summary || 'Operational policy governed under Opus Care Quality Management System.'];

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '40px 16px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Link
            href="/documents"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} /> Back to Document Directory
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 600,
                background: '#dcfce7',
                color: '#15803d',
              }}
            >
              <CheckCircle size={12} /> Version {doc.version} (Current)
            </span>
          </div>
        </div>

        {/* Main Document Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Header Banner */}
          <div style={{ padding: '32px 36px 24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: '#2563eb',
                  background: '#eff6ff',
                  padding: '2px 8px',
                  borderRadius: 4,
                  letterSpacing: '0.04em',
                }}
              >
                {doc.document_code}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>•</span>
              <span style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>{doc.category}</span>
            </div>

            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.25,
                margin: '0 0 12px',
                letterSpacing: '-0.02em',
              }}
            >
              {doc.title}
            </h1>

            <p style={{ fontSize: '0.9375rem', color: '#475569', margin: '0 0 20px', lineHeight: 1.5 }}>
              {doc.change_summary}
            </p>

            {/* Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 12,
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: '0.78125rem',
              }}
            >
              <div>
                <div style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                  Effective Date
                </div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{doc.effective_date}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                  Review Date
                </div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{doc.review_date}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                  Approver
                </div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2 }}>{doc.owner_approver}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6875rem' }}>
                  Audience
                </div>
                <div style={{ fontWeight: 600, color: '#0f172a', marginTop: 2, textTransform: 'capitalize' }}>
                  {doc.target_audience}
                </div>
              </div>
            </div>
          </div>

          {/* Substantive Policy Content Body */}
          <div style={{ padding: '36px', color: '#1e293b', fontSize: '0.9375rem', lineHeight: 1.65 }}>
            {paragraphs.map((para: string, idx: number) => {
              const trimmed = para.trim();
              if (trimmed.startsWith('# ')) {
                return (
                  <h2
                    key={idx}
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      marginTop: 28,
                      marginBottom: 12,
                      borderBottom: '1px solid #e2e8f0',
                      paddingBottom: 6,
                    }}
                  >
                    {trimmed.replace(/^#\s+/, '')}
                  </h2>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3
                    key={idx}
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      marginTop: 24,
                      marginBottom: 8,
                    }}
                  >
                    {trimmed.replace(/^##\s+/, '')}
                  </h3>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h4
                    key={idx}
                    style={{
                      fontSize: '0.98rem',
                      fontWeight: 600,
                      color: '#0f172a',
                      marginTop: 18,
                      marginBottom: 6,
                    }}
                  >
                    {trimmed.replace(/^###\s+/, '')}
                  </h4>
                );
              }
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const items = trimmed.split('\n').filter((l) => l.trim().length > 0);
                return (
                  <ul key={idx} style={{ paddingLeft: 22, margin: '12px 0' }}>
                    {items.map((item, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>
                        {item.replace(/^[-*]\s+/, '')}
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={idx} style={{ marginBottom: 16 }}>
                  {trimmed}
                </p>
              );
            })}
          </div>

          {/* Governance Footer */}
          <div
            style={{
              padding: '20px 36px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Opus Care Support Services · ABN: 41 267 197 576 · Controlled Document
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Document Ref: {doc.document_code} · v{doc.version}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
