import nodemailer from 'nodemailer'
import { SystemSettings } from '@prisma/client'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"仙顶寺" <noreply@xiandingsi.cn>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return true
  } catch (error) {
    console.error('[EMAIL] Send failed:', error)
    return false
  }
}

export const sendRegistrationConfirmation = async (
  to: string,
  name: string,
  taskName: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8B0000;">仙顶寺 - 登记确认</h2>
      <p>尊敬的 <strong>${name}</strong>，您好！</p>
      <p>您的 <strong>${taskName}</strong> 申请已成功提交。</p>
      <p>我们将在 1-2 个工作日内完成审核，感谢您的护持！</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        仙顶寺<br/>
        浙江省湖州市吴兴区栖贤山
      </p>
    </div>
  `
  return sendEmail({ to, subject: `仙顶寺 - ${taskName} 登记确认`, html })
}

export const sendApprovalNotification = async (
  to: string,
  name: string,
  taskName: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8B0000;">仙顶寺 - 登记审核通过</h2>
      <p>尊敬的 <strong>${name}</strong>，您好！</p>
      <p>您的 <strong>${taskName}</strong> 申请已审核通过。</p>
      <p>感恩您的护持，愿佛力加持，六时吉祥！</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        仙顶寺<br/>
        浙江省湖州市吴兴区栖贤山
      </p>
    </div>
  `
  return sendEmail({ to, subject: `仙顶寺 - ${taskName} 审核通过`, html })
}

export const sendRejectionNotification = async (
  to: string,
  name: string,
  taskName: string,
  reason: string
): Promise<boolean> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #8B0000;">仙顶寺 - 登记审核通知</h2>
      <p>尊敬的 <strong>${name}</strong>，您好！</p>
      <p>您的 <strong>${taskName}</strong> 申请未通过审核。</p>
      <p>原因：${reason || '信息不完整'}</p>
      <p>如有疑问，请联系寺院工作人员。</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        仙顶寺<br/>
        浙江省湖州市吴兴区栖贤山
      </p>
    </div>
  `
  return sendEmail({ to, subject: `仙顶寺 - ${taskName} 审核通知`, html })
}

export const verifyConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify()
    return true
  } catch (error) {
    console.error('[EMAIL] SMTP connection failed:', error)
    return false
  }
}
