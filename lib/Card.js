'use strict';

/**
 * Represents credit card details.
 */
class Card {
  /**
   * @param {string|null} number - Card number.
   * @param {string|number|null} exp_month - Expiration month.
   * @param {string|number|null} exp_year - Expiration year.
   * @param {string|null} cvv - Card verification value.
   */
  constructor(number = null, exp_month = null, exp_year = null, cvv = null) {
    this.number    = number;
    this.exp_month = exp_month;
    this.exp_year  = exp_year;
    this.cvv       = cvv;
  }
}

module.exports = Card;
