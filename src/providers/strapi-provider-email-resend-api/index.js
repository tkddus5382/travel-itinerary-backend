const { Resend } = require('resend');

module.exports = {
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
