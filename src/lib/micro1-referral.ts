const REFERRAL_CODE = "d790a258-6628-4b5c-a5ea-9220a8e3f994";
const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function micro1ReferralApplyUrl(jobId: string): string | null {
  if (!JOB_ID.test(jobId)) return null;
  const url = new URL(`https://jobs.micro1.ai/post/${jobId}`);
  url.searchParams.set("referralCode", REFERRAL_CODE);
  url.searchParams.set("utm_source", "referral");
  url.searchParams.set("utm_medium", "share");
  url.searchParams.set("utm_campaign", "job_referral");
  return url.toString();
}
