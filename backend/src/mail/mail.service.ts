import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.fromEmail = this.configService.get('MAIL_FROM') || 'noreply@juristique.bj';
    this.appUrl = this.configService.get('APP_URL') || 'http://localhost:3000';

    const host = this.configService.get('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(this.configService.get('SMTP_PORT') || '587'),
        secure: this.configService.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });
    } else {
      // Dev mode: log emails to console
      this.logger.warn('No SMTP_HOST configured — emails will be logged to console');
      this.transporter = null as any;
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.transporter) {
      this.logger.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      this.logger.log(`[DEV EMAIL] Body: ${html.substring(0, 200)}...`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"Juristique.bj" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
    }
  }

  async sendVerificationEmail(email: string, fullName: string, token: string) {
    const link = `${this.appUrl}/verifier-email?token=${token}`;
    await this.send(email, 'Vérifiez votre adresse e-mail — Juristique.bj', `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1A237E; margin-bottom: 16px;">Bienvenue sur Juristique.bj</h2>
        <p>Bonjour ${fullName},</p>
        <p>Merci de vous être inscrit(e). Veuillez vérifier votre adresse e-mail en cliquant sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #0D1642, #3949AB); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">
            Vérifier mon e-mail
          </a>
        </p>
        <p style="font-size: 13px; color: #5F6477;">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet e-mail.</p>
        <hr style="border: none; border-top: 1px solid #E2E5EF; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9CA3AF;">Juristique.bj — Droit africain francophone</p>
      </div>
    `);
  }

  async sendPasswordResetEmail(email: string, fullName: string, token: string) {
    const link = `${this.appUrl}/nouveau-mot-de-passe?token=${token}`;
    await this.send(email, 'Réinitialisez votre mot de passe — Juristique.bj', `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1A237E; margin-bottom: 16px;">Réinitialisation du mot de passe</h2>
        <p>Bonjour ${fullName},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #0D1642, #3949AB); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">
            Nouveau mot de passe
          </a>
        </p>
        <p style="font-size: 13px; color: #5F6477;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet e-mail.</p>
        <hr style="border: none; border-top: 1px solid #E2E5EF; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9CA3AF;">Juristique.bj — Droit africain francophone</p>
      </div>
    `);
  }

  async sendAlertNotification(email: string, fullName: string, alertName: string, texts: Array<{ title: string; id: string }>) {
    const textList = texts.map(t =>
      `<li style="margin-bottom: 8px;"><a href="${this.appUrl}/textes/${t.id}" style="color: #3949AB;">${t.title}</a></li>`
    ).join('');

    await this.send(email, `Nouvelle alerte : ${alertName} — Juristique.bj`, `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1A237E; margin-bottom: 16px;">Alerte veille juridique</h2>
        <p>Bonjour ${fullName},</p>
        <p>De nouveaux textes correspondent à votre alerte <strong>"${alertName}"</strong> :</p>
        <ul style="padding-left: 20px; margin: 16px 0;">${textList}</ul>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${this.appUrl}/profil" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #0D1642, #3949AB); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">
            Voir mes alertes
          </a>
        </p>
        <p style="font-size: 12px; color: #9CA3AF;">Juristique.bj — Droit africain francophone</p>
      </div>
    `);
  }

  async sendWelcomeEmail(email: string, fullName: string) {
    await this.send(email, 'Bienvenue sur Juristique.bj !', `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1A237E; margin-bottom: 16px;">Bienvenue, ${fullName} !</h2>
        <p>Votre compte Juristique.bj a été vérifié avec succès.</p>
        <p>Vous pouvez maintenant :</p>
        <ul style="padding-left: 20px; line-height: 2;">
          <li>Rechercher parmi 500+ textes juridiques de 26 pays</li>
          <li>Créer des alertes de veille juridique</li>
          <li>Commenter et analyser les textes</li>
        </ul>
        <p style="text-align: center; margin: 32px 0;">
          <a href="${this.appUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #0D1642, #3949AB); color: white; text-decoration: none; border-radius: 10px; font-weight: 600;">
            Explorer les textes
          </a>
        </p>
        <p style="font-size: 12px; color: #9CA3AF;">Juristique.bj — Droit africain francophone</p>
      </div>
    `);
  }
}
