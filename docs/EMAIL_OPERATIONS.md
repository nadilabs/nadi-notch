# Nadi — Email and Form Operations

Website: https://nadi.asalbikin.id/
Public form APIs: Cloudflare Workers `nadi-waitlist` and `nadi-feedback`.
Private records: D1 databases `nadi-waitlist` and `nadi-feedback`.

## What is live

- The waitlist form records unique email addresses in D1 and reports a real count.
- The feedback form records messages and optional contact information in private D1.
- Both APIs permit browser requests from `https://nadi.asalbikin.id` and the previous GitHub Pages origin.
- Email verification, feedback inbox notifications, and the eventual release email are implemented in Workers **but remain inactive until a verified sender and secrets are configured**.
- Cron: waitlist checks every 6 hours (UTC); feedback retries once per hour. With no mail credentials, neither sends email.
- Site CNAME is `nadi.asalbikin.id`; DNS for `asalbikin.id` is managed by Cloudflare. The currently connected Cloudflare account only has `astakula.com`. Domain-owner access is required for new mail DNS records.

## Activate email sending

1. Get edit access to the **Cloudflare DNS zone for `asalbikin.id`** (or ask the owner to add the provider-provided records). A CNAME/website URL alone does not prove authorization to send email.
2. Sign up or connect the sender service at https://resend.com/domains and add `nadi.asalbikin.id` as a sending domain.
3. Add the exact SPF, DKIM, return-path/MX, and recommended DMARC DNS records shown by Resend. **Do not invent record values or replace existing records blindly.** Verify that the sending domain reaches `Verified` in Resend.
4. Generate a restricted Resend sending API key. Never commit or paste the API key into the website, repository, or a public chat.
5. In Cloudflare **Worker Settings → Variables and Secrets**, configure:

   | Worker | Secret / variable | Value |
   | --- | --- | --- |
   | `nadi-waitlist` | `RESEND_API_KEY` | Resend sending API key (secret) |
   | `nadi-waitlist` | `NADI_MAIL_FROM` | `Nadi Lab <hello@nadi.asalbikin.id>` (only after verification) |
   | `nadi-waitlist` | `NADI_UNSUBSCRIBE_SECRET` | A strong random value, at least 32 bytes (secret); preserve across deployments |
   | `nadi-feedback` | `RESEND_API_KEY` | Resend sending API key (secret) |
   | `nadi-feedback` | `NADI_MAIL_FROM` | The same verified sending identity |
   | `nadi-feedback` | `FEEDBACK_INBOX` | A real inbox you control (secret), such as an existing verified mailbox |

6. **Only after sender verification**, enable the secrets on the live Workers and submit a real test email and a test feedback message through the official website. Confirm inbox delivery, not merely a 200/201 API response.

`hello@nadi.asalbikin.id` is a **sender identity**, not automatically a receiving mailbox. To receive replies at this address, configure a mailbox or email forwarding separately.

## Waitlist lifecycle

- Before sending is enabled: emails are stored uniquely in D1. The frontend does **not** pretend a confirmation email was sent.
- After `RESEND_API_KEY` and `NADI_MAIL_FROM` are set: new signups receive a confirmation link (valid 48 hours). The public count then represents confirmed, not unsubscribed, subscribers.
- Pending legacy signups are offered confirmation by the scheduled Worker after email delivery is configured.
- Repeated requests for the same unconfirmed email are throttled to a 15-minute confirmation interval.
- Confirmation links return visitors to `https://nadi.asalbikin.id/?waitlist=confirmed#download`.
- Every release message contains an unsubscribe link. The user must confirm on the unsubscribe page; email scanners visiting links do not unsubscribe automatically.

## Notify about the first public release

The waitlist release sender is deliberately off until the real installer is available. When Nadi 1.0 has been published:

1. Check the verified public release URL (GitHub Releases or `nadi.asalbikin.id`).
2. Configure `NADI_RELEASE_VERSION` and `NADI_RELEASE_URL` on `nadi-waitlist`.
3. The scheduled Worker sends in small batches only to confirmed, subscribed addresses, with an unsubscribe link and idempotency key. It marks `release_sent_at` after the sending provider accepts the message.
4. Watch Resend delivery and suppression metrics, and respect the account's current daily quotas.
5. Do not set a release URL before the release is public. An earlier setting could trigger unintended announcements.

## Feedback operations

- Every accepted message is saved in private D1, regardless of whether email notification succeeds.
- If email secrets and `FEEDBACK_INBOX` exist, the Worker sends a copy to the inbox.
- Failed notifications remain pending and are retried by the hourly scheduled handler.
- Feedback content is never exposed via a public GET endpoint.
- The feedback form allows an optional reply contact; no message should promise a personal reply.

## Checks and privacy

Run GitHub Actions workflow `Nadi form API smoke test` to verify read-only requests, CORS, and input validation. Its default tests must **not** add fake subscribers.

The currently deployed forms have simple input validation, hidden honeypots, and feedback daily caps. For stronger protection before high-volume promotion, enable Turnstile with server-side validation and conservative rate limits. Do not treat Origin/CORS checks as bot protection.

Do not use the waitlist data for other marketing purposes; provide a working unsubscribe mechanism and delete records on legitimate removal requests. Avoid sending email before the sender is verified.

No Resend API credentials, custom-domain DNS records, or recipient inbox have been connected through this repository.
