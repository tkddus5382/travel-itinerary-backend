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
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};
