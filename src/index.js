'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Set permissions for public role
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) {
      console.log('Public role not found');
      return;
    }

    const contentTypes = [
      'api::country.country',
      'api::city.city',
      'api::category.category',
      'api::tag.tag',
      'api::itinerary.itinerary',
      'api::place.place',
      'api::hotel.hotel',
      'api::activity.activity',
    ];

    const permissions = await strapi
      .query('plugin::users-permissions.permission')
      .findMany({
        where: {
          role: publicRole.id,
        },
      });

    console.log('Setting up public permissions...');

    for (const contentType of contentTypes) {
      // Enable find and findOne for each content type
      const actions = ['find', 'findOne'];

      for (const action of actions) {
        const permission = permissions.find(
          (p) => p.action === `${contentType}.${action}`
        );

        if (permission && !permission.enabled) {
          await strapi
            .query('plugin::users-permissions.permission')
            .update({
              where: { id: permission.id },
              data: { enabled: true },
            });
          console.log(`Enabled ${contentType}.${action}`);
        }
      }
    }

    console.log('Public permissions setup complete!');
  },
};
