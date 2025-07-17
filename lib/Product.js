'use strict';

/**
 * Represents a product configuration for Paymentwall operations.
 */
class Product {
  /**
   * @param {string|number} productId             - Unique identifier for the product.
   * @param {number|string} [amount=0.00]         - Price, formatted with two decimal places.
   * @param {string|null} [currencyCode=null]     - ISO currency code.
   * @param {string|null} [name=null]             - Display name of the product.
   * @param {string} [productType=Product.TYPE_FIXED] - 'fixed' or 'subscription'.
   * @param {number} [periodLength=0]             - Length of the billing period.
   * @param {string|null} [periodType=null]       - 'day', 'week', 'month', or 'year'.
   * @param {boolean|number} [recurring=false]    - Whether this is a recurring subscription.
   * @param {*} [trialProduct]                    - Optional trial product details.
   */
  constructor(
    productId,
    amount = 0.00,
    currencyCode = null,
    name = null,
    productType = Product.TYPE_FIXED,
    periodLength = 0,
    periodType = null,
    recurring = false,
    trialProduct = null
  ) {
    this.productId   = productId;
    this.amount      = Number(amount || 0.00).toFixed(2);
    this.currencyCode = currencyCode;
    this.name         = name;
    this.productType  = productType;
    this.periodLength = periodLength;
    this.periodType   = periodType;
    this.recurring    = recurring;

    if (productType === Product.TYPE_SUBSCRIPTION && recurring) {
      this.trialProduct = trialProduct;
    }
  }

  /**
   * @returns {string|number}
   */
  getId() {
    return this.productId;
  }

  /**
   * @returns {string} Formatted price.
   */
  getAmount() {
    return this.amount;
  }

  /**
   * @returns {string|null}
   */
  getCurrencyCode() {
    return this.currencyCode;
  }

  /**
   * @returns {string|null}
   */
  getName() {
    return this.name;
  }

  /**
   * @returns {string}
   */
  getType() {
    return this.productType;
  }

  /**
   * @returns {string|null}
   */
  getPeriodType() {
    return this.periodType;
  }

  /**
   * @returns {number}
   */
  getPeriodLength() {
    return this.periodLength;
  }

  /**
   * @returns {boolean|number}
   */
  isRecurring() {
    return this.recurring;
  }

  /**
   * @returns {*|undefined}
   */
  getTrialProduct() {
    return this.trialProduct;
  }
}

// Product type constants
Product.TYPE_SUBSCRIPTION = 'subscription';
Product.TYPE_FIXED        = 'fixed';

// Recurrence period constants
Product.PERIOD_TYPE_DAY   = 'day';
Product.PERIOD_TYPE_WEEK  = 'week';
Product.PERIOD_TYPE_MONTH = 'month';
Product.PERIOD_TYPE_YEAR  = 'year';

module.exports = Product;
