'use strict';

/**
 * Mission service for auto-unlocking avatars
 */

module.exports = {
  /**
   * Check and unlock mission-based avatars for a user
   */
  async checkMissions(userId) {
    try {
      // Get all mission-type avatars
      const missionAvatars = await strapi.entityService.findMany('api::avatar.avatar', {
        filters: {
          unlockType: 'mission',
          isActive: true,
        },
      });

      if (!missionAvatars || missionAvatars.length === 0) {
        return;
      }

      // Get already unlocked avatars for this user
      const userAvatars = await strapi.entityService.findMany('api::user-avatar.user-avatar', {
        filters: { user: userId },
        populate: ['avatar'],
      });

      const unlockedAvatarIds = userAvatars.map(ua => ua.avatar.id);

      // Check each mission avatar
      for (const avatar of missionAvatars) {
        // Skip if already unlocked
        if (unlockedAvatarIds.includes(avatar.id)) {
          continue;
        }

        const condition = avatar.unlockCondition;
        if (!condition || !condition.mission) {
          continue;
        }

        const shouldUnlock = await this.checkMissionCondition(userId, condition);

        if (shouldUnlock) {
          // Unlock avatar
          await strapi.entityService.create('api::user-avatar.user-avatar', {
            data: {
              user: userId,
              avatar: avatar.id,
              unlockedAt: new Date(),
              unlockMethod: 'mission',
              unlockDetails: condition.mission,
            },
          });

          console.log('[Mission] Avatar unlocked:', { userId, avatarId: avatar.id, mission: condition.mission });
        }
      }
    } catch (error) {
      console.error('[Mission] Check error:', error);
    }
  },

  /**
   * Check if a specific mission condition is met
   */
  async checkMissionCondition(userId, condition) {
    const { mission, requirement } = condition;

    try {
      switch (mission) {
        case 'firstItinerary':
          // Check if user has created at least one itinerary
          const itineraries = await strapi.entityService.findMany('api::itinerary.itinerary', {
            filters: { user: userId },
            limit: 1,
          });
          return itineraries && itineraries.length > 0;

        case 'itineraryCount':
          // Check if user has created N itineraries
          const itineraryCount = await strapi.db.query('api::itinerary.itinerary').count({
            where: { user: userId },
          });
          return itineraryCount >= (requirement || 1);

        case 'reviewCount':
          // Check if user has written N reviews
          const reviewCount = await strapi.db.query('api::review.review').count({
            where: { user: userId },
          });
          return reviewCount >= (requirement || 1);

        case 'loginStreak':
          // TODO: Implement login streak tracking
          // For now, return false
          return false;

        case 'accountAge':
          // Check if account is N days old
          const user = await strapi.query('plugin::users-permissions.user').findOne({
            where: { id: userId },
          });
          if (!user) return false;

          const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          return accountAge >= (requirement || 1);

        default:
          console.warn('[Mission] Unknown mission type:', mission);
          return false;
      }
    } catch (error) {
      console.error('[Mission] Check condition error:', error);
      return false;
    }
  },

  /**
   * Trigger mission check after specific user action
   */
  async onUserAction(userId, action) {
    console.log('[Mission] User action:', { userId, action });
    await this.checkMissions(userId);
  },
};
