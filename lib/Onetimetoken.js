'use strict';

const ApiObject = require('./ApiObject');
const Card = require('./Card');
const { runAction } = require('./HttpAction');
const querystring = require('querystring');

/**
 * Handles creation of a one-time payment token.
 * @extends ApiObject
 */
class Onetimetoken extends ApiObject {
  /**
   * @param {string|null} number - Card number.
   * @param {string|number|null} exp_month - Card expiration month.
   * @param {string|number|null} exp_year - Card expiration year.
   * @param {string|null} cvv - Card CVV code.
   */
  constructor(number = null, exp_month = null, exp_year = null, cvv = null) {
    super();
    this.card = new Card(number, exp_month, exp_year, cvv);
  }

  /**
   * Create a one-time token for a card.
   *
   * @param {function(Response):void} callback - Callback invoked with the HTTP response.
   */
  createOnetimetoken(callback) {
    const postData = querystring.stringify({
      public_key: this.appKey,
      'card[number]': this.card.number,
      'card[exp_month]': this.card.exp_month,
      'card[exp_year]': this.card.exp_year,
      'card[cvv]': this.card.cvv
    });

    const options = this.createRequest('onetimetoken');
    runAction(options, postData, true, response => callback(response));
  }
}

module.exports = Onetimetoken;
