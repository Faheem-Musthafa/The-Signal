const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type SendEmailArgs = {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  listUnsubscribeUrl: string;
};

export async function sendEmail(args: SendEmailArgs): Promise<{ id?: string }> {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      headers: {
        "List-Unsubscribe": `<${args.listUnsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend send failed (status ${response.status}): ${body.slice(0, 240)}`);
  }

  const data = (await response.json()) as { id?: string };
  return { id: data.id };
}
