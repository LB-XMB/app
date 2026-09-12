import { ApiError, request } from './client';

export type ReportType = 'resource' | 'guide' | 'user' | 'other';

export async function submitReport(input: {
  token: string;
  type: ReportType;
  id: string;
  reason: string;
  label?: string;
}): Promise<void> {
  const payload = await request<{ success?: boolean; message?: string; error?: string }>(
    '/api/reports',
    {
      method: 'POST',
      token: input.token,
      body: {
        reported_type: input.type,
        reported_id: input.id,
        reason: input.reason,
        reported_label: input.label,
      },
    }
  );
  if (!payload.success) {
    throw new ApiError('http', 'report failed', 400, payload.error ?? payload.message);
  }
}

export const REPORT_REASONS = [
  { id: 'dead_link', label: 'Lien mort / fichier manquant' },
  { id: 'bad_content', label: 'Mauvais contenu ou hors sujet' },
  { id: 'wrong_category', label: 'Mauvaise catégorie / console' },
  { id: 'other', label: 'Autre' },
] as const;
