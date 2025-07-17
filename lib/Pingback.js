'use strict';

var Base        = require('./Base');
var Product     = require('./Product');
var inherits    = require('inherits');
var Signature   = require('./Signature/Pingback');
var querystring = require('querystring');

/**
 * Pingback type constants.
 * @enum {number}
 */
Pingback.PINGBACK_TYPE_REGULAR  = 0;
Pingback.PINGBACK_TYPE_GOODWILL = 1;
Pingback.PINGBACK_TYPE_NEGATIVE = 2;

/**
 * Handles validation and parsing of Paymentwall pingbacks.
 *
 * @param {Object|string} parameters
 * @param {string}        ipAddress
 * @param {boolean}       [pingbackForBrick]
 * @constructor
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

Object.assign(Pingback.prototype, {
  validate: function(skipIpWhitelistCheck) {
    var skip = !!skipIpWhitelistCheck;

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

  isSignatureValid: function() {
    var signatureParamsToSign = {};
    var signatureParams = [];

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

    if (!this.parameters.sign_version ||
        this.parameters.sign_version === this.SIGNATURE_VERSION_1) {

      // use arrow fn so `this` inside refers to the Pingback instance
      signatureParams.forEach(field => {
        signatureParamsToSign[field] =
          this.parameters[field] !== undefined ? this.parameters[field] : null;
      });
      this.parameters.sign_version = this.SIGNATURE_VERSION_1;

    } else {
      signatureParamsToSign = this.parameters;
    }

    var calculated = Signature.calculateSignature(
      signatureParamsToSign,
      this.getSecretKey(),
      this.parameters.sign_version
    );
    var passed = this.parameters.sig !== undefined ? this.parameters.sig : null;

    return passed === calculated;
  },

  isIpAddressValid: function() {
    var ipsWhitelist = [
      '174.36.92.186',
      '174.36.96.66',
      '174.36.92.187',
      '174.36.92.192',
      '174.37.14.28'
    ];

    if (ipsWhitelist.indexOf(this.ipAddress) >= 0) {
      return true;
    }
    var match = this.ipAddress.match(/^216\.127\.71\.(\d{1,3})$/);
    return !!match && (match[1] >= 0 && match[1] <= 255);
  },

  isParametersValid: function() {
    var requiredParams = [];
    var apiType = this.getApiType();

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

    var valid = true;
    // arrow fn binds `this` from outer context
    requiredParams.forEach(field => {
      if (this.parameters[field] === undefined || this.parameters[field] === '') {
        this.appendToErrors('Parameter ' + field + ' is missing');
        valid = false;
      }
    });

    return valid;
  },

  getParameter: function(param) {
    return this.parameters[param];
  },

  getType: function() {
    var type = parseInt(this.getParameter('type'), 10);
    var validTypes = [
      Pingback.PINGBACK_TYPE_REGULAR,
      Pingback.PINGBACK_TYPE_GOODWILL,
      Pingback.PINGBACK_TYPE_NEGATIVE
    ];
    return validTypes.indexOf(type) >= 0 ? type : undefined;
  },

  getUserId:               function() { return this.getParameter('uid'); },
  getVirtualCurrencyAmount:function() { return this.getParameter('currency'); },
  getProductId:            function() { return this.getParameter('goodsid'); },
  getProductPeriodLength:  function() { return this.getParameter('slength'); },
  getProductPeriodType:    function() { return this.getParameter('speriod'); },
  getReferenceId:          function() { return this.getParameter('ref'); },
  getPingbackUniqueId:     function() { return this.getReferenceId() + '_' + this.getType(); },

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

  getProducts: function() {
    var result = [];
    var ids = this.getParameter('goodsid');
    if (Array.isArray(ids)) {
      ids.forEach(id => result.push(new Product(id)));
    }
    return result;
  },

  isDeliverable: function() {
    var type = this.getType();
    return type === Pingback.PINGBACK_TYPE_REGULAR ||
           type === Pingback.PINGBACK_TYPE_GOODWILL;
  },

  isCancelable: function() {
    return this.getType() === Pingback.PINGBACK_TYPE_NEGATIVE;
  }
});

module.exports = Pingback;
