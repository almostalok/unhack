import { prisma } from "@/lib/prisma";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cert = await prisma.certificate.findUnique({
    where: { verifyCode: code },
    include: {
      user: true,
    },
  });

  if (!cert) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <h1 className="text-2xl font-semibold">Certificate not found</h1>
        <p className="mt-2 text-slate-600">The verification code appears invalid.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold text-[#534AB7]">Certificate Verified</h1>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="text-sm text-slate-500">Participant</div>
        <div className="text-lg font-semibold">{cert.user.name}</div>
        <div className="mt-4 text-sm text-slate-500">Type</div>
        <div>{cert.type}</div>
        <div className="mt-4 text-sm text-slate-500">Issued</div>
        <div>{cert.issuedAt.toDateString()}</div>
        <div className="mt-4 text-sm text-slate-500">Verify Code</div>
        <div className="font-mono">{cert.verifyCode}</div>
      </div>
    </div>
  );
}
