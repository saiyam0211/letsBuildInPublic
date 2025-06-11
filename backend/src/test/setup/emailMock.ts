import { vi } from 'vitest';

// Mock the entire email service module
vi.mock('../../services/emailService', () => ({
  EmailService: {
    getInstance: vi.fn().mockReturnValue({
      sendVerificationEmail: vi.fn().mockResolvedValue(true),
      sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
      sendWelcomeEmail: vi.fn().mockResolvedValue(true),
    }),
    sendVerificationEmail: vi.fn().mockResolvedValue(true),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
  },
}));

// Also mock nodemailer to prevent any SMTP connections
vi.mock('nodemailer', () => ({
  createTransport: vi.fn().mockReturnValue({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: vi.fn().mockResolvedValue(true),
  }),
}));
