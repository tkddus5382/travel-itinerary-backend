module.exports = {
  async beforeCreate(event) {
    const { data } = event.params;

    // JWT 토큰에서 사용자 ID 가져오기
    if (event.state && event.state.user && event.state.user.id) {
      data.user = event.state.user.id;
    }
  },
};
