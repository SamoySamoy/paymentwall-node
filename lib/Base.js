'use strict';

const Config = require('./Config');

/**
 * Core SDK base class providing configuration and utility methods.
 * @extends Config
 */
class Base extends Config {
  /**
   * @param {...*} args - Arguments forwarded to Config constructor.
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {number} API type constant.
   */
  getApiType() {
    return this.apiType;
  }

  /**
   * @returns {string} Application key.
   */
  getAppKey() {
    return this.appKey;
  }

  /**
   * @returns {string} Secret key.
   */
  getSecretKey() {
    return this.secretKey;
  }

  /**
   * Merge properties from source into target.
   * @param {Object} target
   * @param {Object} source
   * @returns {Object} Merged target object.
   */
  objectMerge(target, source) {
    return Object.assign(target, source);
  }

  /**
   * Add an error message to the internal list.
   * @param {string} err
   * @returns {number} New length of the error array.
   */
  appendToErrors(err) {
    return this.errors.push(err);
  }

  /**
   * Retrieve all error messages.
   * @returns {string[]} Array of error messages.
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Get a newline-separated summary of errors.
   * @returns {string}
   */
  getErrorSummary() {
    return this.errors.join('\n');
  }
}

// API type constants
Base.API_VC    = 1;
Base.API_GOODS = 2;
Base.API_CART  = 3;

module.exports = Base;
