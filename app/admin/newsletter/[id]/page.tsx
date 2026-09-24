'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AdminLoginGate from '@/components/admin/AdminLoginGate';
import type { CampaignDTO, DraftRequest, DraftResult, NewsletterStatusDTO } from '@/lib/newsletter/types';
import {
  ApiError,
  apiFetch,
  CampaignStatusBadge,
  dangerButton,
  formatDateTime,
  inputClass,
  primaryButton,
  secondaryButton,
  SetupNotices,
  useApiError,
} from '../_shared';

const TEST_EMAIL_KEY = 'newsletter-test-email';
const SUBJECT_WARN = 60;
const PREVIEW_WARN = 110;

interface Fields {
  subject: string;
  previewText: string;
  body: string;
  aiBrief: string;
}

const EMPTY_FIELDS: Fields = { subject: '', previewText: '', body: '', aiBrief: '' };

function fieldsOf(c: CampaignDTO): Fields {
  return { subject: c.subject, previewText: c.previewText, body: c.body, aiBrief: c.aiBrief ?? '' };
}

function sameFields(a: Fields, b: Fields): boolean {
  return a.subject === b.subject && a.previewText === b.previewText && a.body === b.body && a.aiBrief === b.aiBrief;
}

function readStoredTestEmail(): string {
  try {
    return localStorage.getItem(TEST_EMAIL_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function NewsletterEditorPage() {
  return (
    <AdminLoginGate probeUrl="/api/admin/newsletter/status" title="Newsletter">
      <Editor />
    </AdminLoginGate>
  );
}

function Editor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const handleError = useApiError();
  const campaignUrl = `/api/admin/newsletter/campaigns/${id}`;

  // Server state
  const [campaign, setCampaign] = useState<CampaignDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<NewsletterStatusDTO | null>(null);

  // Form state; `saved` is what the server last acknowledged
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [saved, setSaved] = useState<Fields>(EMPTY_FIELDS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveSeq = useRef(0);

  // Preview
  const [preview, setPreview] = useState<{ key: string; html: string } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<'desktop' | 'mobile'>('desktop');

  // AI
  const [drafting, setDrafting] = useState<'draft' | 'revise' | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [instruction, setInstruction] = useState('');

  // Test send
  const [testTo, setTestTo] = useState(readStoredTestEmail);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  // Send / resume / delete
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);

  const loaded = campaign !== null;
  const campaignStatus = campaign?.status;
  const isDraft = campaignStatus === 'draft';
  const dirty = !sameFields(fields, saved);

  /** Replace local state with the server's copy (on load, or when the campaign stopped being a draft). */
  const adoptCampaign = useCallback((c: CampaignDTO) => {
    setCampaign(c);
    setFields(fieldsOf(c));
    setSaved(fieldsOf(c));
  }, []);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    apiFetch<{ campaign: CampaignDTO }>(campaignUrl)
      .then(({ campaign: c }) => {
        if (!cancelled) adoptCampaign(c);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(handleError(err));
      });
    apiFetch<NewsletterStatusDTO>('/api/admin/newsletter/status')
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch((err) => {
        if (!cancelled) handleError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [campaignUrl, adoptCampaign, handleError]);

  const save = useCallback(
    async (values: Fields): Promise<boolean> => {
      const seq = ++saveSeq.current;
      setSaving(true);
      setSaveError(null);
      try {
        const { campaign: updated } = await apiFetch<{ campaign: CampaignDTO }>(campaignUrl, {
          method: 'PATCH',
          body: {
            subject: values.subject,
            previewText: values.previewText,
            body: values.body,
            aiBrief: values.aiBrief,
          },
        });
        if (seq === saveSeq.current) {
          setSaved(values);
          setCampaign(updated);
        }
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          // No longer a draft (e.g. sent from another tab): show what the server has.
          apiFetch<{ campaign: CampaignDTO }>(campaignUrl)
            .then(({ campaign: c }) => adoptCampaign(c))
            .catch(() => {});
        }
        if (seq === saveSeq.current) setSaveError(handleError(err));
        return false;
      } finally {
        if (seq === saveSeq.current) setSaving(false);
      }
    },
    [campaignUrl, adoptCampaign, handleError]
  );

  // Autosave ~1s after the last edit
  useEffect(() => {
    if (!isDraft || !dirty) return;
    const t = setTimeout(() => {
      void save(fields);
    }, 1000);
    return () => clearTimeout(t);
  }, [fields, isDraft, dirty, save]);

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // Live preview, debounced
  const previewKey = JSON.stringify([fields.subject, fields.previewText, fields.body]);
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    const key = JSON.stringify([fields.subject, fields.previewText, fields.body]);
    const t = setTimeout(() => {
      apiFetch<{ html: string }>('/api/admin/newsletter/preview', {
        method: 'POST',
        body: { subject: fields.subject, previewText: fields.previewText, body: fields.body },
      })
        .then(({ html }) => {
          if (cancelled) return;
          setPreview({ key, html });
          setPreviewError(null);
        })
        .catch((err) => {
          if (!cancelled) setPreviewError(handleError(err));
        });
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [loaded, fields.subject, fields.previewText, fields.body, handleError]);
  const previewStale = preview !== null && preview.key !== previewKey;

  // Poll progress while sending
  useEffect(() => {
    if (campaignStatus !== 'sending') return;
    const iv = setInterval(() => {
      apiFetch<{ campaign: CampaignDTO }>(campaignUrl)
        .then(({ campaign: c }) => {
          setCampaign(c);
          setPollError(null);
        })
        .catch((err) => setPollError(handleError(err)));
    }, 3000);
    return () => clearInterval(iv);
  }, [campaignStatus, campaignUrl, handleError]);

  const updateField = (key: keyof Fields, value: string) => {
    setFields((f) => ({ ...f, [key]: value }));
  };

  const runAi = async (mode: 'draft' | 'revise') => {
    const brief = fields.aiBrief.trim();
    if (!brief) {
      setAiError('Describe what this newsletter is about first.');
      return;
    }
    if (mode === 'revise' && !instruction.trim()) {
      setAiError('Say what you would like changed.');
      return;
    }
    const request: DraftRequest =
      mode === 'draft'
        ? { brief }
        : {
            brief,
            current: { subject: fields.subject, previewText: fields.previewText, body: fields.body },
            instruction: instruction.trim(),
          };
    setDrafting(mode);
    setAiError(null);
    try {
      const result = await apiFetch<DraftResult>('/api/admin/newsletter/draft', { method: 'POST', body: request });
      setFields((f) => ({ ...f, subject: result.subject, previewText: result.previewText, body: result.body }));
      setNotes(result.notes);
      if (mode === 'revise') setInstruction('');
    } catch (err) {
      setAiError(handleError(err));
    } finally {
      setDrafting(null);
    }
  };

  const sendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const to = testTo.trim();
    if (!to) return;
    setTesting(true);
    setTestResult(null);
    try {
      localStorage.setItem(TEST_EMAIL_KEY, to);
    } catch {
      // Storage unavailable (private mode etc.); not important.
    }
    try {
      if (dirty && !(await save(fields))) {
        setTestResult({ ok: false, text: "Couldn't save your changes, so the test wasn't sent." });
        return;
      }
      await apiFetch<{ ok: true }>(`${campaignUrl}/test`, { method: 'POST', body: { to } });
      setTestResult({ ok: true, text: `Test sent to ${to}. It can take a minute to arrive.` });
    } catch (err) {
      setTestResult({ ok: false, text: handleError(err) });
    } finally {
      setTesting(false);
    }
  };

  const startSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const { campaign: c } = await apiFetch<{ campaign: CampaignDTO }>(`${campaignUrl}/send`, { method: 'POST' });
      adoptCampaign(c);
      setConfirmSendOpen(false);
    } catch (err) {
      setSendError(handleError(err));
    } finally {
      setSending(false);
    }
  };

  const deleteDraft = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch<{ ok: true }>(campaignUrl, { method: 'DELETE' });
      router.push('/admin/newsletter');
    } catch (err) {
      setDeleteError(handleError(err));
      setDeleting(false);
    }
  };

  if (loadError && !campaign) {
    return (
      <PageShell>
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {loadError}
        </div>
      </PageShell>
    );
  }

  if (!campaign) {
    return (
      <PageShell>
        <p className="text-sm text-gray-500">Loading newsletter...</p>
      </PageShell>
    );
  }

  const readOnly = !isDraft;
  const fieldsLocked = readOnly || drafting !== null;
  const subscribedCount = status?.subscribedCount ?? 0;

  let sendBlockedReason: string | null = null;
  if (!status) sendBlockedReason = 'Checking setup...';
  else if (!status.resendConfigured) sendBlockedReason = "Sending isn't connected yet.";
  else if (!fields.subject.trim()) sendBlockedReason = 'Add a subject first.';
  else if (!fields.body.trim()) sendBlockedReason = 'Write the newsletter first.';
  else if (dirty || saving) sendBlockedReason = 'Saving your changes...';
  else if (subscribedCount === 0) sendBlockedReason = 'There are no subscribers yet.';

  let saveLabel: string;
  if (saving) saveLabel = 'Saving…';
  else if (saveError) saveLabel = 'Not saved';
  else if (dirty) saveLabel = 'Unsaved';
  else saveLabel = 'Saved';

  return (
    <PageShell>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="min-w-0">
          <Link href="/admin/newsletter" className="text-sm text-sage-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 rounded">
            &larr; All newsletters
          </Link>
          <div className="mt-1 flex items-center gap-3 min-w-0">
            <h1 className={`text-2xl font-bold truncate ${fields.subject ? 'text-gray-900' : 'text-gray-400'}`}>
              {fields.subject || 'Untitled draft'}
            </h1>
            <CampaignStatusBadge status={campaign.status} />
          </div>
        </div>
        {isDraft && (
          <div className="flex items-center gap-3">
            <span
              role="status"
              className={`text-sm ${saveError ? 'text-red-700' : dirty || saving ? 'text-gray-500' : 'text-green-700'}`}
            >
              {saveLabel}
            </span>
            <button
              type="button"
              onClick={() => void save(fields)}
              disabled={saving || !dirty}
              className={secondaryButton}
            >
              Save
            </button>
          </div>
        )}
      </div>

      <SetupNotices status={status} />

      {saveError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4 text-sm">
          Couldn&apos;t save: {saveError}
        </div>
      )}

      {readOnly && <ProgressCard campaign={campaign} pollError={pollError} onResume={startSend} resuming={sending} resumeError={sendError} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6 min-w-0">
          {isDraft && (
            <section aria-labelledby="ai-heading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 id="ai-heading" className="text-lg font-semibold text-gray-900 mb-3">
                AI assistant
              </h2>
              <label htmlFor="ai-brief" className="block text-sm font-medium text-gray-700 mb-1">
                What&apos;s this newsletter about?
              </label>
              <textarea
                id="ai-brief"
                value={fields.aiBrief}
                onChange={(e) => updateField('aiBrief', e.target.value)}
                rows={4}
                disabled={drafting !== null}
                placeholder="e.g. New pear cider on tap this weekend, lavender is done for the year, Halloween hours"
                className={inputClass}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void runAi('draft')}
                  disabled={drafting !== null || !status?.aiConfigured || !fields.aiBrief.trim()}
                  className={primaryButton}
                >
                  {drafting === 'draft' ? 'Writing...' : 'Draft with AI'}
                </button>
                {fields.body.trim() && drafting === null && (
                  <span className="text-xs text-gray-500">Replaces the current subject, preview text and body.</span>
                )}
              </div>

              {drafting && (
                <div role="status" className="mt-3 flex items-center gap-2 text-sm text-sage-800 bg-sage-50 border border-sage-200 rounded-md px-3 py-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  {drafting === 'draft'
                    ? 'Writing… checking the cider list, events and hours. This can take up to a minute.'
                    : 'Revising… this can take up to a minute.'}
                </div>
              )}

              {aiError && (
                <p role="alert" className="mt-3 text-sm text-red-700">
                  {aiError}
                </p>
              )}

              {notes.length > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <h3 className="text-sm font-semibold text-amber-900 mb-2">Check before sending</h3>
                  <ul className="space-y-1.5">
                    {notes.map((note, i) => (
                      <li key={i}>
                        <label className="flex items-start gap-2 text-sm text-amber-900">
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded border-amber-300 text-sage-600 focus:ring-sage-500"
                          />
                          <span>{note}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {fields.body.trim() && (
                <form
                  className="mt-4 pt-4 border-t border-gray-100"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void runAi('revise');
                  }}
                >
                  <label htmlFor="ai-instruction" className="block text-sm font-medium text-gray-700 mb-1">
                    Ask for changes
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="ai-instruction"
                      type="text"
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      disabled={drafting !== null}
                      placeholder="e.g. make it shorter, and mention the 4-pack"
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      disabled={drafting !== null || !status?.aiConfigured || !instruction.trim()}
                      className={`${secondaryButton} whitespace-nowrap`}
                    >
                      {drafting === 'revise' ? 'Revising...' : 'Revise'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          <section aria-labelledby="content-heading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
            <h2 id="content-heading" className="text-lg font-semibold text-gray-900">
              Email
            </h2>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <span className={`text-xs ${fields.subject.length > SUBJECT_WARN ? 'text-amber-700' : 'text-gray-400'}`}>
                  {fields.subject.length}/{SUBJECT_WARN}
                </span>
              </div>
              <input
                id="subject"
                type="text"
                value={fields.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                disabled={fieldsLocked}
                className={inputClass}
                aria-describedby={fields.subject.length > SUBJECT_WARN ? 'subject-warning' : undefined}
              />
              {fields.subject.length > SUBJECT_WARN && (
                <p id="subject-warning" className="mt-1 text-xs text-amber-700">
                  Long subjects get cut off in most inboxes. Try to keep it under {SUBJECT_WARN} characters.
                </p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label htmlFor="preview-text" className="block text-sm font-medium text-gray-700">
                  Preview text
                </label>
                <span className={`text-xs ${fields.previewText.length > PREVIEW_WARN ? 'text-amber-700' : 'text-gray-400'}`}>
                  {fields.previewText.length}/{PREVIEW_WARN}
                </span>
              </div>
              <input
                id="preview-text"
                type="text"
                value={fields.previewText}
                onChange={(e) => updateField('previewText', e.target.value)}
                disabled={fieldsLocked}
                className={inputClass}
                aria-describedby="preview-text-help"
              />
              <p id="preview-text-help" className={`mt-1 text-xs ${fields.previewText.length > PREVIEW_WARN ? 'text-amber-700' : 'text-gray-500'}`}>
                {fields.previewText.length > PREVIEW_WARN
                  ? `Inboxes only show about ${PREVIEW_WARN} characters of this.`
                  : 'The grey line shown after the subject in the inbox.'}
              </p>
            </div>

            <div>
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <textarea
                id="body"
                value={fields.body}
                onChange={(e) => updateField('body', e.target.value)}
                disabled={fieldsLocked}
                rows={22}
                className={`${inputClass} font-mono leading-relaxed`}
                aria-describedby="body-help"
              />
              <p id="body-help" className="mt-1 text-xs text-gray-500">
                <code>##</code> for a heading, <code>**bold**</code>, <code>-</code> for bullets,{' '}
                <code>[text](https://…)</code> for links, <code>![alt](https://…image)</code> for images.
              </p>
            </div>
          </section>

          {isDraft && (
            <section aria-labelledby="send-heading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-5">
              <h2 id="send-heading" className="text-lg font-semibold text-gray-900">
                Send
              </h2>

              <form onSubmit={sendTest}>
                <label htmlFor="test-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Send a test to
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="test-email"
                    type="email"
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    required
                  />
                  <button
                    type="submit"
                    disabled={testing || !testTo.trim() || !status?.resendConfigured || !fields.subject.trim() || !fields.body.trim()}
                    className={`${secondaryButton} whitespace-nowrap`}
                  >
                    {testing ? 'Sending...' : 'Send test'}
                  </button>
                </div>
                {testResult && (
                  <p role="status" className={`mt-2 text-sm ${testResult.ok ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult.text}
                  </p>
                )}
              </form>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setSendError(null);
                    setConfirmSendOpen(true);
                  }}
                  disabled={sendBlockedReason !== null}
                  className={`${primaryButton} w-full sm:w-auto`}
                >
                  Send to {subscribedCount} subscriber{subscribedCount === 1 ? '' : 's'}
                </button>
                {sendBlockedReason && <p className="mt-2 text-xs text-gray-500">{sendBlockedReason}</p>}
              </div>

              <div className="pt-4 border-t border-gray-100">
                {confirmDelete ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-700">Delete this draft for good?</span>
                    <button type="button" onClick={deleteDraft} disabled={deleting} className={dangerButton}>
                      {deleting ? 'Deleting...' : 'Delete draft'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className={secondaryButton}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm text-red-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
                  >
                    Delete draft
                  </button>
                )}
                {deleteError && (
                  <p role="alert" className="mt-2 text-sm text-red-700">
                    {deleteError}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right column: preview */}
        <div className="min-w-0">
          <section aria-labelledby="preview-heading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <h2 id="preview-heading" className="text-lg font-semibold text-gray-900">
                  Preview
                </h2>
                {previewStale && <span className="text-xs text-gray-400">Updating…</span>}
              </div>
              <div className="inline-flex rounded-md border border-gray-300 bg-white" role="group" aria-label="Preview width">
                <button
                  type="button"
                  onClick={() => setPreviewWidth('desktop')}
                  aria-pressed={previewWidth === 'desktop'}
                  className={`px-3 py-1.5 text-sm font-medium rounded-l-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 ${
                    previewWidth === 'desktop' ? 'bg-sage-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewWidth('mobile')}
                  aria-pressed={previewWidth === 'mobile'}
                  className={`px-3 py-1.5 text-sm font-medium rounded-r-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 ${
                    previewWidth === 'mobile' ? 'bg-sage-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {previewError && (
              <p role="alert" className="mb-3 text-sm text-red-700">
                Preview failed: {previewError}
              </p>
            )}

            <div className="bg-gray-100 rounded p-2 sm:p-4 overflow-x-auto">
              {preview ? (
                <iframe
                  title="Email preview"
                  srcDoc={preview.html}
                  sandbox=""
                  className="h-[700px] bg-white rounded border mx-auto block max-w-full"
                  style={{ width: previewWidth === 'desktop' ? 600 : 375 }}
                />
              ) : (
                <div className="h-[700px] flex items-center justify-center text-sm text-gray-500">
                  {previewError ? 'No preview yet.' : 'Loading preview...'}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {confirmSendOpen && (
        <SendConfirmModal
          subject={fields.subject}
          recipientCount={subscribedCount}
          sending={sending}
          error={sendError}
          onCancel={() => setConfirmSendOpen(false)}
          onConfirm={startSend}
        />
      )}
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}

function ProgressCard({
  campaign,
  pollError,
  onResume,
  resuming,
  resumeError,
}: {
  campaign: CampaignDTO;
  pollError: string | null;
  onResume: () => void;
  resuming: boolean;
  resumeError: string | null;
}) {
  const done = campaign.sentCount + campaign.failedCount;
  const pct = campaign.recipientCount > 0 ? Math.min(100, Math.round((done / campaign.recipientCount) * 100)) : 0;
  const barColor =
    campaign.status === 'sent' ? 'bg-green-500' : campaign.status === 'paused' ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <section aria-labelledby="progress-heading" className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
      <h2 id="progress-heading" className="text-lg font-semibold text-gray-900 mb-3">
        {campaign.status === 'sending' && 'Sending…'}
        {campaign.status === 'sent' && 'Sent'}
        {campaign.status === 'paused' && 'Sending paused'}
      </h2>

      <div
        className="h-3 w-full bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Sending progress"
      >
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Sent</dt>
          <dd className="text-lg font-semibold text-gray-900">{campaign.sentCount}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Failed</dt>
          <dd className={`text-lg font-semibold ${campaign.failedCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>
            {campaign.failedCount}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Recipients</dt>
          <dd className="text-lg font-semibold text-gray-900">{campaign.recipientCount}</dd>
        </div>
      </dl>

      {campaign.status === 'sending' && (
        <p className="mt-3 text-sm text-gray-600">
          You can leave this page; sending continues in the background.
          {pollError && <span className="text-red-700"> (Couldn&apos;t refresh progress: {pollError})</span>}
        </p>
      )}

      {campaign.status === 'sent' && campaign.sentAt && (
        <p className="mt-3 text-sm text-gray-600">Finished {formatDateTime(campaign.sentAt)}.</p>
      )}

      {campaign.status === 'paused' && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3">
          {campaign.lastError && (
            <p className="text-sm text-amber-900 mb-3">
              <span className="font-medium">Why it stopped:</span> {campaign.lastError}
            </p>
          )}
          <button type="button" onClick={onResume} disabled={resuming} className={primaryButton}>
            {resuming ? 'Resuming...' : 'Resume sending'}
          </button>
          <p className="mt-2 text-xs text-amber-900">Only people who haven&apos;t received it yet will get it.</p>
          {resumeError && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {resumeError}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function SendConfirmModal({
  subject,
  recipientCount,
  sending,
  error,
  onCancel,
  onConfirm,
}: {
  subject: string;
  recipientCount: number;
  sending: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, sending]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !sending) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-confirm-title"
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <h2 id="send-confirm-title" className="text-lg font-semibold text-gray-900 mb-3">
          Send this newsletter?
        </h2>
        <dl className="text-sm space-y-2 mb-4">
          <div>
            <dt className="text-gray-500">Subject</dt>
            <dd className="font-medium text-gray-900 break-words">{subject}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Recipients</dt>
            <dd className="font-medium text-gray-900">
              {recipientCount} subscriber{recipientCount === 1 ? '' : 's'}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-gray-700 mb-4">This can&apos;t be undone.</p>
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={sending} className={secondaryButton}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={sending} className={primaryButton} autoFocus>
            {sending ? 'Sending...' : `Send to ${recipientCount}`}
          </button>
        </div>
      </div>
    </div>
  );
}
