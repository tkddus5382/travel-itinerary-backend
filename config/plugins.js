const { Resend } = require('resend');

module.exports = ({ env }) => ({
  email: {
    config: {
      provider: 'resend-api',
      providerOptions: {
        apiKey: env('RESEND_API_KEY'),
      },
      settings: {
        defaultFrom: env('RESEND_DEFAULT_FROM', 'tkddus5382@gmail.com'),
        defaultReplyTo: env('RESEND_DEFAULT_REPLY_TO', 'tkddus5382@gmail.com'),
      },
    },
  },
});

// Custom Resend provider using HTTP API (Railway blocks SMTP)
module.exports['resend-api'] = {
  init: (providerOptions = {}, settings = {}) => {
    const resend = new Resend(providerOptions.apiKey);
    
    return {
      send: async (options) => {
        const { from, to, cc, bcc, replyTo, subject, text, html } = options;
        
        try {
          const result = await resend.emails.send({
            from: from || settings.defaultFrom,
            to: Array.isArray(to) ? to : [to],
            cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
            bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
            reply_to: replyTo || settings.defaultReplyTo,
            subject,
            text,
            html,
          });
          
          return result;
        } catch (error) {
          throw new Error(`Failed to send email: ${error.message}`);
        }
      },
    };
  },
};
