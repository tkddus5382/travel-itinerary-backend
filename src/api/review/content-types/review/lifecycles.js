module.exports = {
  async beforeCreate(event) {
    // JWT 토큰에서 로그인한 사용자 정보 가져오기
    const userId = event.state?.user?.id;

    console.log('[Review Lifecycle] beforeCreate called');
    console.log('[Review Lifecycle] User ID from JWT:', userId);
    console.log('[Review Lifecycle] Current data:', event.params.data);

    if (userId) {
      // user 필드 설정
      event.params.data.user = userId;
      console.log('[Review Lifecycle] User field set to:', userId);
    } else {
      console.log('[Review Lifecycle] WARNING: No user ID found in JWT token!');
    }
  },

  async afterCreate(event) {
    console.log('[Review Lifecycle] afterCreate - Final result:', {
      id: event.result.id,
      user: event.result.user,
    });
  },
};
