export type InviteHtmlParams = {
  orgName: string;
  roleRequested: "STAFF" | "CLIENT";
  clientName?: string | null;
  inviteLink: string;
};

export function renderInviteEmailHtml({
  orgName,
  roleRequested,
  clientName,
  inviteLink,
}: InviteHtmlParams) {
  const roleLabel = roleRequested === "STAFF" ? "Equipe" : "Cliente";
  const safeOrg = escapeHtml(orgName);
  const safeClient = clientName ? escapeHtml(clientName) : "";

  return `
<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Convite</title>
  </head>
  <body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;font-family:Inter,Segoe UI,Helvetica,Arial,system-ui,sans-serif">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(0,0,0,0.04)">
        <h1 style="margin:0 0 6px;font-size:20px;line-height:28px;font-weight:700;color:#0f172a">Você foi convidado(a)!</h1>
        <p style="margin:0 0 16px;font-size:14px;color:#64748b">Revise os detalhes antes de aceitar o convite.</p>

        <div style="margin:0 0 16px">
          <p style="margin:0 0 8px;font-size:14px"><span style="color:#334155;font-weight:600;margin-right:8px">Organização:</span> ${safeOrg}</p>
          <p style="margin:0 0 8px;font-size:14px"><span style="color:#334155;font-weight:600;margin-right:8px">Papel:</span> ${roleLabel}</p>
          ${
            clientName
              ? `<p style="margin:0 0 8px;font-size:14px"><span style=\"color:#334155;font-weight:600;margin-right:8px\">Cliente:</span> ${safeClient}</p>`
              : ""
          }
        </div>

        <a href="${inviteLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">Aceitar convite</a>

        <p style="margin:16px 0 0;font-size:12px;color:#475569">
          Se o botão não funcionar, copie este link e cole no navegador:<br/>
          <span style="color:#0ea5e9;word-break:break-all">${inviteLink}</span>
        </p>
      </div>

      <p style="margin-top:12px;font-size:11px;color:#94a3b8;text-align:center">Esta é uma mensagem automática. Não responda este e-mail.</p>
    </div>
  </body>
</html>`;
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
