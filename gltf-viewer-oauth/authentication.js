const fetch = require('node-fetch');
const OnshapeStrategy = require('passport-onshape').Strategy;
const config = require('./config');

/**
 * Configures settings needed to implement OAuth flows.
 * @param {module} passport: An import of Passport.js
 * @returns {null}
 */
function init(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user);
  });
  passport.deserializeUser(function(obj, done) {
    done(null, obj);
  });

  passport.use(new OnshapeStrategy({
      clientID: config.oauthClientId,
      clientSecret: config.oauthClientSecret,
      callbackUrl: config.oauthCallbackUrl,
      authorizationURL: `${config.oauthUrl}/oauth/authorize`,
      tokenURL: `${config.oauthUrl}/oauth/token`,
      userProfileURL: `${config.apiUrl}/api/users/sessioninfo`
    },
    (accessToken, refreshToken, profile, done) => {
      // asynchronous verification, for effect...
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;

      // To keep the example simple, the user's Onshape profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Onshape account with a user record in your database,
      // and return that user instead.
      return done(null, profile);
    }
  ));
}

function onOAuthTokenReceived(body, req) {
  const jsonResponse = JSON.parse(body);
  if (jsonResponse) {
    req.user.accessToken = jsonResponse.access_token;
    req.user.refreshToken = jsonResponse.refresh_token;
  }
}

const pendingTokenRefreshes = {};
function refreshOAuthToken(req, res, next) {

  if (pendingTokenRefreshes[req.session.id]) {
    return pendingTokenRefreshes[req.session.id]
  }
  const refreshToken = req.user.refreshToken;

  if (refreshToken) {
    pendingTokenRefreshes[req.session.id] = fetch(`${config.oauthUrl}/oauth/token`, {
      method: "post",
      body: JSON.stringify({
        'client_id': config.oauthClientId,
        'client_secret': config.oauthClientSecret,
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken
      })
    }).then(body => {
      delete pendingTokenRefreshes[req.session.id];
      return onOAuthTokenReceived(body, req);
    }).catch(error => {
      delete pendingTokenRefreshes[req.session.id];
      console.log('Error refreshing OAuth Token: ', error);
      res.status(401).send({
        authUri: getAuthUri(),
        msg: 'Authentication required.'
      });
      throw(error);
    });
    return pendingTokenRefreshes[req.session.id];
  } else {
    return Promise.reject('No refresh_token');
  }
}

function getAuthUri() {
  return config.oauthUrl + '/oauth/authorize?response_type=code&client_id=' + oauthClientId;
}

module.exports = {
  'init': init,
  'refreshOAuthToken': refreshOAuthToken,
  'getAuthUri': getAuthUri
};