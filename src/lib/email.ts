import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail(input: SendEmailInput) {
  if (!resend) return { skipped: true };

  const from = "UnHack <noreply@unhack.app>";
  return resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}
