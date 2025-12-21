'use strict';

/**
 * avatar controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::avatar.avatar', ({ strapi }) => ({
  /**
   * Get all available avatars with user's unlock status
   */
  async available(ctx) {
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

      // Get all active avatars
      const avatars = await strapi.entityService.findMany('api::avatar.avatar', {
        filters: { isActive: true },
        populate: ['image'],
        sort: ['sortOrder:asc', 'id:asc'],
      });

      // Get user's unlocked avatars
      const userAvatars = await strapi.entityService.findMany('api::user-avatar.user-avatar', {
        filters: { user: user.id },
        populate: ['avatar'],
      });

      const unlockedAvatarIds = userAvatars.map(ua => ua.avatar.id);

      // Map avatars with unlock status
      const result = avatars.map(avatar => ({
        id: avatar.id,
        name: avatar.name,
        image: avatar.image,
        rarity: avatar.rarity,
        description: avatar.description,
        unlockType: avatar.unlockType,
        unlockCondition: avatar.unlockCondition,
        isUnlocked: unlockedAvatarIds.includes(avatar.id),
      }));

      return { data: result };
    } catch (error) {
      console.error('[Avatar] Available error:', error);
      return ctx.internalServerError('Failed to get avatars', { error: error.message });
    }
  },

  /**
   * Select an avatar as user's active avatar
   */
  async select(ctx) {
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

      const { avatarId } = ctx.request.body;

      if (!avatarId) {
        return ctx.badRequest('Avatar ID is required');
      }

      // Check if user has unlocked this avatar
      const userAvatar = await strapi.entityService.findMany('api::user-avatar.user-avatar', {
        filters: {
          user: user.id,
          avatar: avatarId,
        },
      });

      if (!userAvatar || userAvatar.length === 0) {
        return ctx.forbidden('You have not unlocked this avatar');
      }

      // Update user's selected avatar
      await strapi.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { selectedAvatar: avatarId },
      });

      console.log('[Avatar] User selected avatar:', { userId: user.id, avatarId });

      return { message: 'Avatar selected successfully' };
    } catch (error) {
      console.error('[Avatar] Select error:', error);
      return ctx.internalServerError('Failed to select avatar', { error: error.message });
    }
  },

  /**
   * Unlock an avatar for a user (used internally by mission system)
   */
  async unlock(ctx) {
    try {
      const { userId, avatarId, unlockMethod, unlockDetails } = ctx.request.body;

      if (!userId || !avatarId || !unlockMethod) {
        return ctx.badRequest('userId, avatarId, and unlockMethod are required');
      }

      // Check if already unlocked
      const existing = await strapi.entityService.findMany('api::user-avatar.user-avatar', {
        filters: {
          user: userId,
          avatar: avatarId,
        },
      });

      if (existing && existing.length > 0) {
        return { message: 'Avatar already unlocked', alreadyUnlocked: true };
      }

      // Create unlock entry
      const userAvatar = await strapi.entityService.create('api::user-avatar.user-avatar', {
        data: {
          user: userId,
          avatar: avatarId,
          unlockedAt: new Date(),
          unlockMethod,
          unlockDetails: unlockDetails || '',
        },
      });

      console.log('[Avatar] Unlocked:', { userId, avatarId, unlockMethod });

      return {
        message: 'Avatar unlocked successfully',
        data: userAvatar,
      };
    } catch (error) {
      console.error('[Avatar] Unlock error:', error);
      return ctx.internalServerError('Failed to unlock avatar', { error: error.message });
    }
  },
}));
