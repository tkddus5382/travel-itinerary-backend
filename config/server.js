module.exports = ({ env }) => {
  const keys = (env('APP_KEYS', '') || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    app: {
      keys,
    },
    proxy: true, // Trust proxy headers (required for Railway HTTPS)
    url: env('URL', 'http://localhost:1337'),
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};
