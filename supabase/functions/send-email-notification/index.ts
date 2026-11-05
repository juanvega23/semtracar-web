// RF-56: envía por correo los avisos críticos. La dispara un Database Webhook sobre INSERT en public.notifications.
// Secretos (supabase secrets set): RESEND_API_KEY, EMAIL_FROM, EMAIL_WEBHOOK_SECRET y, opcional, WEB_URL.
import { createClient } from 'npm:@supabase/supabase-js@2';

const CRITICAL_TYPES = new Set(['paquete_listo', 'recibo_generado', 'entrega_confirmada']);

type NotificationRecord = {
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function renderHtml(record: NotificationRecord, webUrl: string | undefined) {
  const button =
    webUrl && record.link
      ? `<p style="margin:24px 0"><a href="${escapeHtml(webUrl + record.link)}" style="background:#fc5207;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Ver en SEMTRACAR</a></p>`
      : '';
  return `<div style="font-family:Arial,sans-serif;color:#21284b;max-width:520px;margin:auto;padding:24px">
    <p style="font-size:20px;font-weight:700;color:#fc5207;margin:0 0 16px">SEMTRACAR</p>
    <h1 style="font-size:20px;margin:0 0 8px">${escapeHtml(record.title)}</h1>
    <p style="font-size:15px;line-height:1.5;margin:0">${escapeHtml(record.body)}</p>
    ${button}
    <p style="font-size:12px;color:#5b6478;margin-top:24px">Este es un correo automático. No es necesario responderlo.</p>
  </div>`;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('EMAIL_WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-webhook-secret') !== secret) {
    return json({ error: 'No autorizado' }, 401);
  }

  const payload = await req.json().catch(() => null);
  const record: NotificationRecord | undefined = payload?.record;
  if (payload?.table !== 'notifications' || !record?.user_id) {
    return json({ error: 'Solicitud inválida' }, 400);
  }
  if (!CRITICAL_TYPES.has(record.type)) {
    return json({ skipped: 'El aviso no es crítico' });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM');
  if (!apiKey || !from) {
    return json({ error: 'Falta configurar el proveedor de correo' }, 500);
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: user, error } = await supabase
    .from('users')
    .select('email')
    .eq('id', record.user_id)
    .maybeSingle();
  if (error || !user?.email) {
    return json({ error: 'No se encontró el correo del usuario' }, 404);
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: user.email,
      subject: record.title,
      html: renderHtml(record, Deno.env.get('WEB_URL')),
    }),
  });
  if (!response.ok) {
    console.error('Resend respondió', response.status);
    return json({ error: 'El proveedor de correo rechazó el envío' }, 502);
  }
  return json({ sent: true });
});
