'use strict';

/**
 * event-code controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::event-code.event-code', ({ strapi }) => ({
  /**
   * Redeem an event code
   */
  async redeem(ctx) {
    try {
      // Verify JWT manually
      const token = ctx.request.header.authorization?.replace('Bearer ', '');
      if (!token) {
        return ctx.unauthorized('No token provided');
      }

      const decoded = await strapi.plugin('users-permissions').service('jwt').verify(token);
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: decoded.id }
      });

      if (!user) {
        return ctx.unauthorized('Invalid token');
      }

      const { code } = ctx.request.body;

      if (!code) {
        return ctx.badRequest('Code is required');
      }

      // Find event code
      const eventCodes = await strapi.entityService.findMany('api::event-code.event-code', {
        filters: {
          code: code.toUpperCase(),
          isActive: true,
        },
        populate: ['avatar'],
      });

      if (!eventCodes || eventCodes.length === 0) {
        return ctx.badRequest('Invalid or inactive code');
      }

      const eventCode = eventCodes[0];

      // Check validity period
      const now = new Date();
      if (eventCode.validFrom && new Date(eventCode.validFrom) > now) {
        return ctx.badRequest('This code is not yet valid');
      }
      if (eventCode.validUntil && new Date(eventCode.validUntil) < now) {
        return ctx.badRequest('This code has expired');
      }

      // Check usage limit
      if (eventCode.maxUses && eventCode.currentUses >= eventCode.maxUses) {
        return ctx.badRequest('This code has reached its usage limit');
      }

      const avatarId = eventCode.avatar.id;

      // Check if user already has this avatar
      const existing = await strapi.entityService.findMany('api::user-avatar.user-avatar', {
        filters: {
          user: user.id,
          avatar: avatarId,
        },
      });

      if (existing && existing.length > 0) {
        return ctx.badRequest('You already have this avatar');
      }

      // Unlock avatar for user
      await strapi.entityService.create('api::user-avatar.user-avatar', {
        data: {
          user: user.id,
          avatar: avatarId,
          unlockedAt: new Date(),
          unlockMethod: 'event_code',
          unlockDetails: code,
        },
      });

      // Increment usage count
      await strapi.entityService.update('api::event-code.event-code', eventCode.id, {
        data: {
          currentUses: eventCode.currentUses + 1,
        },
      });

      console.log('[EventCode] Redeemed:', { userId: user.id, code, avatarId });

      return {
        message: 'Avatar unlocked successfully!',
        avatar: {
          id: eventCode.avatar.id,
          name: eventCode.avatar.name,
          image: eventCode.avatar.image,
          rarity: eventCode.avatar.rarity,
        },
      };
    } catch (error) {
      console.error('[EventCode] Redeem error:', error);
      return ctx.internalServerError('Failed to redeem code', { error: error.message });
    }
  },
}));
