'use strict';

const Base        = require('./Base');
const Product     = require('./Product');
const inherits    = require('inherits');
const Signature   = require('./Signature/Pingback');
const querystring = require('querystring');

/**
 * Pingback type constants.
 * @enum {number}
 */
function Pingback(parameters, ipAddress, pingbackForBrick) {
  this.errors = [];

  if (typeof parameters === 'string') {
    this.parameters = querystring.parse(parameters);
  } else if (parameters && typeof parameters === 'object') {
    this.parameters = parameters;
  } else {
    console.log(
      'Error: Please pass Object as the queryData in Paymentwall.Pingback(queryData, ip)'
    );
    this.parameters = {};
  }

  this.ipAddress        = ipAddress;
  this.pingbackForBrick = !!pingbackForBrick;
}

inherits(Pingback, Base);

Pingback.PINGBACK_TYPE_REGULAR  = 0;
Pingback.PINGBACK_TYPE_GOODWILL = 1;
Pingback.PINGBACK_TYPE_NEGATIVE = 2;

Object.assign(Pingback.prototype, {
  /**
   * Validate presence of required parameters, IP whitelist, and signature.
   *
   * @param {boolean} [skipIpWhitelistCheck=false] Skip IP check if true
   * @returns {boolean} True if pingback is valid
   */
  validate: function(skipIpWhitelistCheck) {
    const skip = !!skipIpWhitelistCheck;

    if (!this.isParametersValid()) {
      this.appendToErrors('Missing parameters');
      return false;
    }
    if (!skip && !this.isIpAddressValid()) {
      this.appendToErrors('IP address is not whitelisted');
      return false;
    }
    if (!this.isSignatureValid()) {
      this.appendToErrors('Wrong signature');
      return false;
    }
    return true;
  },

  /**
   * Verify that the signature matches expected value.
   *
   * @returns {boolean}
   */
  isSignatureValid: function() {
    let signatureParamsToSign = {};
    let signatureParams = [];

    if (this.getApiType() === this.API_VC) {
      signatureParams = ['uid', 'currency', 'type', 'ref'];
    } else if (this.getApiType() === this.API_GOODS) {
      signatureParams = this.pingbackForBrick
        ? ['uid','slength','speriod','type','ref']
        : ['uid','goodsid','slength','speriod','type','ref'];
    } else {
      // CART API
      signatureParams = ['uid','goodsid','type','ref'];
      this.parameters.sign_version = this.SIGNATURE_VERSION_2;
    }

    if (
      !this.parameters.sign_version ||
      this.parameters.sign_version === this.SIGNATURE_VERSION_1
    ) {
      // arrow fn so `this` inside refers to the Pingback instance
      signatureParams.forEach(field => {
        signatureParamsToSign[field] =
          this.parameters[field] !== undefined ? this.parameters[field] : null;
      });
      this.parameters.sign_version = this.SIGNATURE_VERSION_1;
    } else {
      signatureParamsToSign = this.parameters;
    }

    const calculated = Signature.calculateSignature(
      signatureParamsToSign,
      this.getSecretKey(),
      this.parameters.sign_version
    );
    const passed = this.parameters.sig !== undefined ? this.parameters.sig : null;

    return passed === calculated;
  },

  /**
   * Check that the pingback originates from an allowed IP.
   *
   * @returns {boolean}
   */
  isIpAddressValid: function() {
    const ipsWhitelist = [
      '174.36.92.186',
      '174.36.96.66',
      '174.36.92.187',
      '174.36.92.192',
      '174.37.14.28'
    ];

    if (ipsWhitelist.includes(this.ipAddress)) {
      return true;
    }
    const match = this.ipAddress.match(/^216\.127\.71\.(\d{1,3})$/);
    return !!match && match[1] >= 0 && match[1] <= 255;
  },

  /**
   * Ensure that all required fields are present.
   *
   * @returns {boolean}
   */
  isParametersValid: function() {
    let requiredParams = [];
    const apiType = this.getApiType();

    if (apiType === this.API_VC) {
      requiredParams = ['uid','currency','type','ref','sig'];
    } else if (apiType === this.API_GOODS) {
      requiredParams = this.pingbackForBrick
        ? ['uid','type','ref','sig']
        : ['uid','goodsid','type','ref','sig'];
    } else {
      requiredParams = ['uid','goodsid','type','ref','sig'];
    }

    if (typeof this.parameters !== 'object') {
      this.parameters = querystring.parse(this.parameters);
    }

    let valid = true;
    requiredParams.forEach(field => {
      if (this.parameters[field] === undefined || this.parameters[field] === '') {
        this.appendToErrors('Parameter ' + field + ' is missing');
        valid = false;
      }
    });

    return valid;
  },

  /**
   * Retrieve a raw parameter value.
   *
   * @param {string} param
   * @returns {*}
   */
  getParameter: function(param) {
    return this.parameters[param];
  },

  /**
   * Parse and validate pingback type.
   *
   * @returns {number|undefined}
   */
  getType: function() {
    const type = parseInt(this.getParameter('type'), 10);
    const validTypes = [
      Pingback.PINGBACK_TYPE_REGULAR,
      Pingback.PINGBACK_TYPE_GOODWILL,
      Pingback.PINGBACK_TYPE_NEGATIVE
    ];
    return validTypes.includes(type) ? type : undefined;
  },

  /** @returns {string} */
  getUserId: function() {
    return this.getParameter('uid');
  },

  /** @returns {string} */
  getVirtualCurrencyAmount: function() {
    return this.getParameter('currency');
  },

  /** @returns {string} */
  getProductId: function() {
    return this.getParameter('goodsid');
  },

  /** @returns {string} */
  getProductPeriodLength: function() {
    return this.getParameter('slength');
  },

  /** @returns {string} */
  getProductPeriodType: function() {
    return this.getParameter('speriod');
  },

  /** @returns {string} */
  getReferenceId: function() {
    return this.getParameter('ref');
  },

  /** @returns {string} */
  getPingbackUniqueId: function() {
    return `${this.getReferenceId()}_${this.getType()}`;
  },

  /**
   * Build a Product from this pingback.
   *
   * @returns {Product}
   */
  getProduct: function() {
    return new Product(
      this.getProductId(),
      0,
      null,
      null,
      this.getProductPeriodLength() > 0
        ? Product.TYPE_SUBSCRIPTION
        : Product.TYPE_FIXED,
      this.getProductPeriodLength(),
      this.getProductPeriodType()
    );
  },

  /**
   * Handle multiple product IDs (Cart API).
   *
   * @returns {Product[]}
   */
  getProducts: function() {
    const result = [];
    const ids = this.getParameter('goodsid');
    if (Array.isArray(ids)) {
      ids.forEach(id => result.push(new Product(id)));
    }
    return result;
  },

  /** @returns {boolean} */
  isDeliverable: function() {
    const type = this.getType();
    return (
      type === Pingback.PINGBACK_TYPE_REGULAR ||
      type === Pingback.PINGBACK_TYPE_GOODWILL
    );
  },

  /** @returns {boolean} */
  isCancelable: function() {
    return this.getType() === Pingback.PINGBACK_TYPE_NEGATIVE;
  }
});

module.exports = Pingback;
