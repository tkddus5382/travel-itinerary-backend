module.exports = ({ env }) => ({
  email: {
    config: {
      provider: require.resolve('../src/providers/strapi-provider-email-resend-api'),
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
