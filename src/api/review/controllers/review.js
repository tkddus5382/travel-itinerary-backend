'use strict';

/**
 * review controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::review.review', ({ strapi }) => ({
  async create(ctx) {
    // 로그인한 사용자 정보 가져오기
    const user = ctx.state.user;

    console.log('[Review Controller] Create called');
    console.log('[Review Controller] Authenticated user:', user);
    console.log('[Review Controller] Request body:', ctx.request.body);

    if (!user) {
      return ctx.unauthorized('You must be logged in to create a review');
    }

    // user를 요청 데이터에 추가
    ctx.request.body.data = {
      ...ctx.request.body.data,
      user: user.id,
    };

    console.log('[Review Controller] Modified request body:', ctx.request.body);

    // 기본 create 로직 실행
    const response = await super.create(ctx);

    return response;
  },
}));
