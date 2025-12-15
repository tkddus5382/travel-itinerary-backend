module.exports = ({ env }) => {
  // Handle APP_KEYS as either array or comma-separated string
  const appKeys = env('APP_KEYS');
  const keys = typeof appKeys === 'string' ? appKeys.split(',') : env.array('APP_KEYS', []);

  return {
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    app: {
      keys: keys,
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};
