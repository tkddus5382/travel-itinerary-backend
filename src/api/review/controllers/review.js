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

  /**
   * Get reviews by current user
   */
  async myReviews(ctx) {
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

      // Get user's reviews with itinerary and likedBy populated
      const reviews = await strapi.entityService.findMany('api::review.review', {
        filters: { user: user.id },
        populate: {
          itinerary: {
            fields: ['id', 'title', 'slug'],
            populate: {
              city: {
                fields: ['slug'],
                populate: {
                  country: {
                    fields: ['slug'],
                  },
                },
              },
            },
          },
          likedBy: {
            fields: ['id'],
          },
        },
        sort: ['createdAt:desc'],
      });

      // Format response with like count
      const formattedReviews = reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        itinerary: review.itinerary,
        likeCount: review.likedBy ? review.likedBy.length : 0,
      }));

      return {
        data: formattedReviews,
        meta: {
          total: formattedReviews.length,
        },
      };
    } catch (error) {
      console.error('[Review] My reviews error:', error);
      return ctx.internalServerError('Failed to get reviews', { error: error.message });
    }
  },
}));
