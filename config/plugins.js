module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: 'smtp.resend.com',
        port: 587,
        secure: false,
        auth: {
          user: 'resend',
          pass: env('RESEND_API_KEY'),
        },
      },
      settings: {
        defaultFrom: env('RESEND_DEFAULT_FROM', 'tkddus5382@gmail.com'),
        defaultReplyTo: env('RESEND_DEFAULT_REPLY_TO', 'tkddus5382@gmail.com'),
      },
    },
  },
});
