// components/email-template.tsx
export function EmailTemplate({ resetLink }: { resetLink: string }) {
  return `
    <div>
      <h1>Reset your password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
    </div>
  `;
}