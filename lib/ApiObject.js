'use strict';

const Base        = require('./Base');
const inherits    = require('inherits');
const querystring = require('querystring');

/**
 * Base class for all API objects.
 * Inherits configuration and utilities from Base.
 *
 * @constructor
 */
function ApiObject() {
  // No-op; configuration is handled by Base
}

inherits(ApiObject, Base);

Object.assign(ApiObject.prototype, {
  /**
   * Check whether the SDK is running in test (Brick) environment.
   * Uses presence of underscore(s) in secretKey.
   *
   * @returns {boolean}
   */
  checkProjectEnv: function() {
    return /_+/.test(this.secretKey);
  },

  /**
   * Build HTTP POST options object.
   *
   * @param {string} url     Hostname or base URL
   * @param {string} path    Request path
   * @param {string} method  HTTP method (e.g. 'Post')
   * @returns {Object}       Request options for http/https.request
   */
  createPostOptions: function(url, path, method) {
    return {
      host:   url,
      path:   path,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-ApiKey':      this.secretKey
      }
    };
  },

  /**
   * Create request options for Brick endpoints.
   * Chooses test or production URL based on environment and request type.
   *
   * @param {string} type                'onetimetoken', 'charge', or 'subscription'
   * @param {string} [additional_path]   Path suffix for charge/subscription
   * @returns {Object}                   Options object for HttpAction
   */
  createRequest: function(type, additional_path) {
    let url;
    let path;
    const method = 'Post';
    const extra  = additional_path || '';

    if (!this.checkProjectEnv() && type === 'onetimetoken') {
      url  = this.BRICK_ONETIMETOKEN_TEST_BASE_URL;
      path = this.BRICK_ONETIMETOKEN_TEST_PATH;
    } else {
      url = this.BRICK_BASE_URL;
      if (type === 'onetimetoken') {
        path = this.BRICK_ONETIMETOKEN_PATH;
      } else if (type === 'charge') {
        path = this.BRICK_CHARGE_PATH + extra;
      } else if (type === 'subscription') {
        path = this.BRICK_SUBSCRIPTION_CHARGE_PATH + extra;
      }
    }

    return this.createPostOptions(url, path, method);
  }
});

module.exports = ApiObject;
