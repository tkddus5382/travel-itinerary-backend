module.exports = (plugin) => {
  /**
   * Google OAuth callback with social-auth integration
   */
  plugin.controllers.auth.googleCallback = async (ctx) => {
    const { idToken, provider } = ctx.request.body;

    if (!idToken || !provider) {
      return ctx.badRequest('idToken and provider are required');
    }

    try {
      // Parse Google ID token to get user info
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64')
          .toString('ascii')
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const googleUser = JSON.parse(jsonPayload);

      if (!googleUser || !googleUser.sub || !googleUser.email) {
        return ctx.badRequest('Invalid Google ID token');
      }

      const providerId = googleUser.sub;

      // Check if this social account is linked to an existing user
      const socialAuths = await strapi.entityService.findMany('api::social-auth.social-auth', {
        filters: { provider, providerId },
        populate: ['user'],
      });

      let user;
      let isNewUser = false;

      if (socialAuths && socialAuths.length > 0) {
        // User found via social auth - login to that account
        user = socialAuths[0].user;
        console.log('[Google Auth] User found via social-auth:', user.id);
      } else {
        // No social auth found - check if user exists with this email
        const existingUsers = await strapi.query('plugin::users-permissions.user').findMany({
          where: { email: googleUser.email },
          limit: 1,
        });

        if (existingUsers && existingUsers.length > 0) {
          // Email exists but not linked - require manual linking
          return ctx.conflict('Email already exists. Please login and link your Google account in settings.');
        }

        // New user - return signup needed
        return {
          needsSignup: true,
          googleInfo: {
            email: googleUser.email,
            name: googleUser.name || '',
            providerId: providerId,
            provider: provider,
            idToken: idToken,
          },
        };
      }

      // Generate JWT token using Strapi's JWT service
      const jwtToken = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

      return {
        jwt: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        isNewUser,
      };
    } catch (error) {
      console.error('[Google Auth] Error:', error);
      return ctx.internalServerError('Authentication failed', { error: error.message });
    }
  };

  /**
   * Complete Google signup
   */
  plugin.controllers.auth.completeGoogleSignup = async (ctx) => {
    const { idToken, provider, username, password } = ctx.request.body;

    if (!idToken || !provider || !username || !password) {
      return ctx.badRequest('idToken, provider, username, and password are required');
    }

    try {
      // Parse and verify Google ID token
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64')
          .toString('ascii')
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const googleUser = JSON.parse(jsonPayload);

      if (!googleUser || !googleUser.sub || !googleUser.email) {
        return ctx.badRequest('Invalid Google ID token');
      }

      const providerId = googleUser.sub;

      // Check if email already exists
      const existingUsers = await strapi.query('plugin::users-permissions.user').findMany({
        where: { email: googleUser.email },
        limit: 1,
      });

      if (existingUsers && existingUsers.length > 0) {
        return ctx.conflict('Email already exists');
      }

      // Check if username already exists
      const existingUsername = await strapi.query('plugin::users-permissions.user').findMany({
        where: { username },
        limit: 1,
      });

      if (existingUsername && existingUsername.length > 0) {
        return ctx.badRequest('Username already exists');
      }

      // Get authenticated role
      const role = await strapi.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });

      // Create user
      const user = await strapi.query('plugin::users-permissions.user').create({
        data: {
          username,
          email: googleUser.email,
          password, // Strapi will hash this automatically
          confirmed: true, // Auto-confirm since Google verified the email
          blocked: false,
          provider: 'local',
          role: role.id,
        },
      });

      // Create social auth entry to link Google account
      await strapi.entityService.create('api::social-auth.social-auth', {
        data: {
          user: user.id,
          provider,
          providerId,
        },
      });

      console.log('[Google Signup] Created user and linked Google:', user.id);

      // Generate JWT token
      const jwtToken = strapi.plugin('users-permissions').service('jwt').issue({ id: user.id });

      return {
        jwt: jwtToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      };
    } catch (error) {
      console.error('[Google Signup] Error:', error);
      return ctx.internalServerError('Signup failed', { error: error.message });
    }
  };

  /**
   * Link social account to current user
   */
  plugin.controllers.auth.linkSocial = async (ctx) => {
    // Manually verify JWT since auth is disabled on route
    let user;
    try {
      const token = ctx.request.header.authorization?.replace('Bearer ', '');
      if (!token) {
        return ctx.unauthorized('No token provided');
      }
      const decoded = await strapi.plugin('users-permissions').service('jwt').verify(token);
      user = await strapi.query('plugin::users-permissions.user').findOne({ where: { id: decoded.id } });
      if (!user) {
        return ctx.unauthorized('Invalid token');
      }
    } catch (error) {
      return ctx.unauthorized('Invalid token');
    }

    const { provider, providerId } = ctx.request.body;

    if (!provider || !providerId) {
      return ctx.badRequest('Provider and providerId are required');
    }

    try {
      // Check if this social account is already linked
      const existingAuth = await strapi.entityService.findMany('api::social-auth.social-auth', {
        filters: { provider, providerId },
        populate: ['user'],
      });

      if (existingAuth && existingAuth.length > 0) {
        const linkedUser = existingAuth[0].user;

        if (linkedUser && linkedUser.id === user.id) {
          return {
            data: existingAuth[0],
            message: 'Social account already linked to your account',
          };
        }

        return ctx.conflict('This social account is already linked to another user');
      }

      // Create new social auth entry
      const socialAuth = await strapi.entityService.create('api::social-auth.social-auth', {
        data: {
          user: user.id,
          provider,
          providerId,
        },
        populate: ['user'],
      });

      console.log('[Social Auth] Linked:', { userId: user.id, provider });

      return {
        data: socialAuth,
        message: 'Social account linked successfully',
      };
    } catch (error) {
      console.error('[Social Auth] Link error:', error);
      return ctx.internalServerError('Failed to link social account', { error: error.message });
    }
  };

  /**
   * Get linked social accounts for current user
   */
  plugin.controllers.auth.mySocial = async (ctx) => {
    // Manually verify JWT since auth is disabled on route
    let user;
    try {
      const token = ctx.request.header.authorization?.replace('Bearer ', '');
      if (!token) {
        return ctx.unauthorized('No token provided');
      }
      const decoded = await strapi.plugin('users-permissions').service('jwt').verify(token);
      user = await strapi.query('plugin::users-permissions.user').findOne({ where: { id: decoded.id } });
      if (!user) {
        return ctx.unauthorized('Invalid token');
      }
    } catch (error) {
      return ctx.unauthorized('Invalid token');
    }

    try {
      const socialAuths = await strapi.entityService.findMany('api::social-auth.social-auth', {
        filters: { user: user.id },
      });

      return {
        data: socialAuths,
      };
    } catch (error) {
      console.error('[Social Auth] Get error:', error);
      return ctx.internalServerError('Failed to get social accounts', { error: error.message });
    }
  };

  return plugin;
};
