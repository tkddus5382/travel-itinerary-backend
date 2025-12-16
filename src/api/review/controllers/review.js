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

  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in to update a review');
    }

    try {
      // 기존 리뷰 가져오기
      const existingReview = await strapi.entityService.findOne('api::review.review', id, {
        populate: ['user', 'likedBy'],
      });

      if (!existingReview) {
        return ctx.notFound('Review not found');
      }

      // likedBy 업데이트는 누구나 가능 (자신의 좋아요 추가/제거)
      // rating/content 업데이트는 작성자만 가능
      const { rating, content, likedBy } = ctx.request.body.data;

      // rating이나 content를 수정하려는 경우, 작성자인지 확인
      if ((rating !== undefined || content !== undefined) && existingReview.user?.id !== user.id) {
        return ctx.forbidden('You can only edit your own reviews');
      }

      // 업데이트할 데이터 준비
      const updateData = {};
      if (rating !== undefined) updateData.rating = rating;
      if (content !== undefined) updateData.content = content;
      if (likedBy !== undefined) updateData.likedBy = likedBy;

      console.log('[Review Controller] Updating review:', {
        id,
        userId: user.id,
        updateData,
      });

      // entityService로 업데이트
      const updatedReview = await strapi.entityService.update('api::review.review', id, {
        data: updateData,
        populate: ['user', 'likedBy', 'itinerary'],
      });

      console.log('[Review Controller] Review updated successfully');

      return {
        data: updatedReview,
      };
    } catch (error) {
      console.error('[Review Controller] Error updating review:', error);
      return ctx.badRequest('Failed to update review', { error: error.message });
    }
  },
}));
