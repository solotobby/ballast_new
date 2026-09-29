import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const key = this.config.get<string>("RESEND_API_KEY")?.trim();
    this.resend = key ? new Resend(key) : null;
  }

  async sendInvite(input: {
    to: string;
    organisationName: string;
    role: string;
    siteName: string | null;
    inviteUrl: string;
    invitedBy: string;
  }) {
    const roleLabel = input.role === "site_manager" ? "Site Manager" : "Staff";
    const siteLine = input.siteName ? `<p style="margin:0 0 16px;color:#52657a">Site: <strong>${input.siteName}</strong></p>` : "";
    const html = `
      <div style="font-family:Inter,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="font-size:22px;color:#0b1a2b;margin:0 0 12px">You're invited to ${input.organisationName}</h1>
        <p style="margin:0 0 16px;color:#52657a;line-height:1.55">
          ${input.invitedBy} invited you to join <strong>${input.organisationName}</strong> on Ballast as a
          <strong>${roleLabel}</strong>.
        </p>
        ${siteLine}
        <p style="margin:0 0 20px;color:#52657a;line-height:1.55">
          Accept the invite to log on-site, capture evidence, and keep compliance up to date.
        </p>
        <a href="${input.inviteUrl}" style="display:inline-block;background:#1f6feb;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">
          Accept invite
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#8a9bb0;line-height:1.5">
          If the button doesn't work, copy this link:<br/>
          <span style="word-break:break-all">${input.inviteUrl}</span>
        </p>
      </div>`;

    return this.send({
      to: input.to,
      subject: `Join ${input.organisationName} on Ballast`,
      html,
    });
  }

  async sendPasswordReset(input: { to: string; resetUrl: string }) {
    const html = `
      <div style="font-family:Inter,Segoe UI,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="font-size:22px;color:#0b1a2b;margin:0 0 12px">Reset your Ballast password</h1>
        <p style="margin:0 0 16px;color:#52657a;line-height:1.55">
          We received a request to reset your password for your Ballast account.
        </p>
        <p style="margin:0 0 20px;color:#52657a;line-height:1.55">
          Click the button below to choose a new password. This link is valid for 60 minutes.
        </p>
        <a href="${input.resetUrl}" style="display:inline-block;background:#1f6feb;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">
          Reset password
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#8a9bb0;line-height:1.5">
          If you did not request a password reset, you can safely ignore this email.<br/>
          <span style="word-break:break-all">${input.resetUrl}</span>
        </p>
      </div>`;

    return this.send({
      to: input.to,
      subject: "Reset your Ballast password",
      html,
    });
  }

  private async send(input: { to: string; subject: string; html: string }) {
    const from = this.config.get<string>("MAIL_FROM") ?? "Ballast <onboarding@resend.dev>";
    if (!this.resend) {
      this.logger.warn(`RESEND_API_KEY not set — would email ${input.to}: ${input.subject}`);
      return { id: "dev-skipped" };
    }

    const result = await this.resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (result.error) {
      this.logger.warn(`Resend sandbox restriction for ${input.to}: ${result.error.message}`);
      if (process.env.NODE_ENV === "production") {
        throw new Error(result.error.message);
      }
      return { id: "dev-sandbox-fallback" };
    }

    return result.data;
  }
}
