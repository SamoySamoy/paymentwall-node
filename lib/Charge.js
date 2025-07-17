'use strict';

var HttpAction   = require('./HttpAction');
var ApiObject    = require('./ApiObject');
var inherits     = require('inherits');
var querystring  = require('querystring');

/**
 * Charge object for processing one-time payments.
 *
 * @param {number|string|null} amount             – Payment amount.
 * @param {string}             [currency='USD']   – ISO currency code.
 * @param {string|null}        description        – Charge description.
 * @param {string|null}        email              – Customer email.
 * @param {string|null}        fingerprint        – Customer fingerprint.
 * @param {string|null}        token              – One-time payment token.
 * @param {Object|null}        extra              – Additional parameters.
 * @constructor
 */
function Charge(amount, currency, description, email, fingerprint, token, extra) {
  this.amount      = amount      || null;
  this.currency    = currency    || 'USD';
  this.description = description || null;
  this.email       = email       || null;
  this.fingerprint = fingerprint || null;
  this.token       = token       || null;
  this.extra       = extra       || null;
}

inherits(Charge, ApiObject);

Object.assign(Charge.prototype, {
  /**
   * Create a new charge.
   *
   * @param {function(Response): void} callback – Called with the HTTP response.
   */
  createCharge: function(callback) {
    // Prepare POST parameters
    var params = {
      public_key : this.publickey,
      amount     : this.amount,
      currency   : this.currency,
      description: this.description,
      email      : this.email,
      fingerprint: this.fingerprint,
      token      : this.token
    };

    // Merge any extra parameters
    params = this.objectMerge(params, this.extra);

    // Serialize for HTTP POST
    var postData = querystring.stringify(params);

    // Execute the HTTP action
    var options = this.createRequest('charge');
    HttpAction.runAction(options, postData, true, function(response) {
      callback(response);
    });
  },

  /**
   * Perform an auxiliary operation on a charge (detail, refund, capture, void).
   *
   * @param {string|number}            chargeId – ID of the charge.
   * @param {'detail'|'refund'|'capture'|'void'} type     – Operation type.
   * @param {function(Response): void} callback – Called with the HTTP response.
   */
  otherOperation: function(chargeId, type, callback) {
    var additionalPath = '';

    switch (type) {
      case 'detail':
        additionalPath = '/' + chargeId;
        break;
      case 'refund':
        additionalPath = '/' + chargeId + '/refund';
        break;
      case 'capture':
        additionalPath = '/' + chargeId + '/capture';
        break;
      case 'void':
        additionalPath = '/' + chargeId + '/void';
        break;
      default:
        console.log('Parameter error in charge.otherOperation');
        break;
    }

    // No body for other operations
    var postData = '';
    var options  = this.createRequest('charge', additionalPath);

    HttpAction.runAction(options, postData, true, function(response) {
      callback(response);
    });
  }
});

module.exports = Charge;
