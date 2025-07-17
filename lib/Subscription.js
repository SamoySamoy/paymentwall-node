'use strict';

const HttpAction   = require('./HttpAction');
const ApiObject    = require('./ApiObject');
const inherits     = require('inherits');
const querystring  = require('querystring');

/**
 * Subscription object for managing recurring payments.
 *
 * @param {number|string|null} amount            – Charge amount.
 * @param {string|null}        currency          – ISO currency code.
 * @param {string|null}        description       – Charge description.
 * @param {string|null}        email             – Customer email.
 * @param {string|null}        fingerprint       – Customer fingerprint.
 * @param {string|null}        token             – One-time payment token.
 * @param {string|number|null} period            – Billing period unit (e.g. 'month').
 * @param {number|null}        period_duration   – Billing period length.
 * @param {Object|null}        trial_data        – Trial subscription parameters.
 * @param {Object|null}        extra             – Additional subscription parameters.
 * @constructor
 */
function Subscription(
  amount,
  currency,
  description,
  email,
  fingerprint,
  token,
  period,
  period_duration,
  trial_data,
  extra
) {
  this.amount          = amount          || null;
  this.currency        = currency        || 'USD';
  this.description     = description     || null;
  this.email           = email           || null;
  this.fingerprint     = fingerprint     || null;
  this.token           = token           || null;
  this.period          = period          || null;
  this.period_duration = period_duration || null;
  this.trial_data      = trial_data      || null;
  this.extra           = extra           || null;
}

inherits(Subscription, ApiObject);

Object.assign(Subscription.prototype, {
  /**
   * Create a new subscription.
   *
   * @param {function} callback – Receives the parsed Response.
   */
  createSubscription: function(callback) {
    // Base parameters for subscription
    let params = {
      public_key     : this.publickey,
      amount         : this.amount,
      currency       : this.currency,
      description    : this.description,
      email          : this.email,
      fingerprint    : this.fingerprint,
      token          : this.token,
      period         : this.period,
      period_duration: this.period_duration
    };

    // Merge in trial_data and any extra params
    params = this.objectMerge(params, this.trial_data);
    params = this.objectMerge(params, this.extra);

    // Serialize for HTTP POST
    const post_data = querystring.stringify(params);

    // Execute the HTTP action
    const post_options = this.createRequest('subscription');
    HttpAction.runAction(post_options, post_data, true, function(response) {
      callback(response);
    });
  },

  /**
   * Perform an auxiliary operation on a subscription (detail or cancel).
   *
   * @param {string|number} subscriptionId – ID of the subscription.
   * @param {string}        type           – 'detail' or 'cancel'.
   * @param {function}      callback       – Receives the parsed Response.
   */
  otherOperation: function(subscriptionId, type, callback) {
    let additional_path = '';

    switch (type) {
      case 'detail':
        additional_path = '/' + subscriptionId;
        break;
      case 'cancel':
        additional_path = '/' + subscriptionId + '/cancel';
        break;
      default:
        console.log('Parameter error in subscription.otherOperation');
        break;
    }

    // No POST body for other operations
    const post_data    = '';
    const post_options = this.createRequest('subscription', additional_path);

    HttpAction.runAction(post_options, post_data, true, function(response) {
      callback(response);
    });
  }
});

module.exports = Subscription;
