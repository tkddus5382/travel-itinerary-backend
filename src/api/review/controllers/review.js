'use strict';

/**
 * review controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::review.review', ({ strapi }) => ({
  async create(ctx) {
    // 로그인한 사용자 정보 가져오기
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to create a review');
    }

    // 요청 데이터 가져오기
    const { rating, content, itinerary } = ctx.request.body.data;

    try {
      // entityService를 직접 사용하여 권한 검사 우회
      const review = await strapi.entityService.create('api::review.review', {
        data: {
          rating,
          content,
          itinerary,
          user: user.id,  // 여기서 user 설정!
        },
        populate: ['user', 'likedBy', 'itinerary'],
      });

      console.log('[Review Controller] Review created successfully:', {
        id: review.id,
        user: review.user,
      });

      // Strapi 응답 형식으로 반환
      return {
        data: review,
      };
    } catch (error) {
      console.error('[Review Controller] Error creating review:', error);
      return ctx.badRequest('Failed to create review', { error: error.message });
    }
  },
}));
