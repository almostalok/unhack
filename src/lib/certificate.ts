import puppeteer from "puppeteer";
import QRCode from "qrcode";

type CertificatePayload = {
  name: string;
  eventName: string;
  eventDates: string;
  certificateType: string;
  verifyCode: string;
  logoUrl?: string | null;
};

export async function generateCertificatePdf(payload: CertificatePayload) {
  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify/${payload.verifyCode}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  const page = await browser.newPage();
  await page.setContent(`
    <html>
      <body style="font-family: Inter, sans-serif; margin:0; padding: 36px; background:#f8f8ff;">
        <div style="border: 8px solid #534AB7; border-radius: 18px; background: white; padding: 40px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:32px; font-weight:700; color:#534AB7;">UnHack Certificate</div>
            ${payload.logoUrl ? `<img src="${payload.logoUrl}" style="height:64px;" />` : ""}
          </div>
          <div style="margin-top:36px; font-size:20px; color:#666;">This certifies that</div>
          <div style="font-size:48px; font-weight:700; margin-top:8px; color:#1D9E75;">${payload.name}</div>
          <div style="margin-top:18px; font-size:22px;">has earned: <b>${payload.certificateType}</b></div>
          <div style="margin-top:8px; font-size:20px;">${payload.eventName}</div>
          <div style="margin-top:8px; color:#666;">${payload.eventDates}</div>
          <div style="display:flex; justify-content:space-between; margin-top:36px; align-items:flex-end;">
            <div>
              <div style="width:220px; border-top:1px solid #222; margin-bottom:4px;"></div>
              <div style="font-size:14px; color:#666;">Organizer signature</div>
            </div>
            <div style="text-align:right;">
              <img src="${qrDataUrl}" style="height:90px; width:90px;" />
              <div style="font-size:12px; color:#666;">Code: ${payload.verifyCode}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);

  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return pdf;
}
