'use strict';

const Base = require('./Base');
const Product = require('./Product');
const inherits = require('inherits');
const querystring = require('querystring');
const Signature = require('./Signature/Widget');

/**
 * Widget for building Paymentwall widget URLs and embed HTML.
 *
 * @param {string|number|null} userId
 * @param {string|null} widgetCode
 * @param {Product[]|null} products
 * @param {Object|null} extraParams
 * @constructor
 */
function Widget(userId, widgetCode, products, extraParams) {
  this.errors = [];
  this.userId = userId || null;
  this.widgetCode = widgetCode || null;
  this.products = products || null;
  this.extraParams = extraParams || null;
}

inherits(Widget, Base);

Object.assign(Widget.prototype, {
  /**
   * Determine default signature version.
   * @returns {number}
   */
  getDefaultWidgetSignature: function() {
    return this.getApiType() !== this.API_CART
      ? this.DEFAULT_SIGNATURE_VERSION
      : this.SIGNATURE_VERSION_2;
  },

  /**
   * Build the widget URL with query parameters and signature.
   * @returns {string}
   */
  getUrl: function() {
    const params = {
      key: this.getAppKey(),
      uid: this.userId,
      widget: this.widgetCode
    };

    const productsNumber = this.products.length;

    if (this.getApiType() === this.API_GOODS) {
      if (this.products) {
        if (productsNumber === 1) {
          let product = this.products[0];
          let postTrialProduct = null;

          if (product.getTrialProduct()) {
            postTrialProduct = product;
            product = product.getTrialProduct();
          }

          params.amount = product.getAmount();
          params.currencyCode = product.getCurrencyCode();
          params.ag_name = product.getName();
          params.ag_external_id = product.getId();
          params.ag_type = product.getType();

          if (product.getType() === Product.TYPE_SUBSCRIPTION) {
            params.ag_period_length = product.getPeriodLength();
            params.ag_period_type = product.getPeriodType();

            if (product.isRecurring()) {
              params.ag_recurring = product.isRecurring() ? 1 : 0;

              if (postTrialProduct !== null) {
                params.ag_trial = 1;
                params.ag_post_trial_external_id = postTrialProduct.getId();
                params.ag_post_trial_period_length = postTrialProduct.getPeriodLength();
                params.ag_post_trial_period_type = postTrialProduct.getPeriodType();
                params.ag_post_trial_name = postTrialProduct.getName();
                params.post_trial_amount = postTrialProduct.getAmount();
                params.post_trial_currencyCode = postTrialProduct.getCurrencyCode();
              }
            }
          }
        }
        // multiple products not currently supported
      }
    } else if (this.getApiType() === this.API_CART) {
      let index = 0;
      this.products.forEach(function(product) {
        params['external_ids[' + index + ']'] = product.getId();
        if (product.amount > 0) {
          params['prices[' + index + ']'] = product.getAmount();
        }
        if (product.currencyCode) {
          params['currencies[' + index + ']'] = product.getCurrencyCode();
        }
        index += 1;
      });
    }

    let signatureVersion = this.getDefaultWidgetSignature();
    params.sign_version = signatureVersion;

    if (this.extraParams && this.extraParams.sign_version) {
      signatureVersion = params.sign_version = this.extraParams.sign_version;
    }

    // merge any additional parameters
    this.objectMerge(params, this.extraParams);

    // calculate and append signature
    params.sign = Signature.calculateSignature(
      params,
      this.getSecretKey(),
      signatureVersion
    );

    return (
      this.WIDGET_BASE_URL +
      '/' +
      this.buildController(this.widgetCode) +
      '?' +
      querystring.stringify(params)
    );
  },

  /**
   * Generate HTML iframe code for the widget.
   * @param {Object} [attributes={}]
   * @returns {string}
   */
  getHtmlCode: function(attributes) {
    attributes = attributes || {};

    const defaultAttributes = {
      frameborder: '0',
      width: '750',
      height: '800'
    };

    this.objectMerge(defaultAttributes, attributes);

    let attributesQuery = '';
    for (const attr in attributes) {
      attributesQuery += ' ' + attr + '="' + attributes[attr] + '"';
    }

    return '<iframe src="' + this.getUrl() + '"' + attributesQuery + '></iframe>';
  },

  /**
   * Select the controller path segment based on API type and widget code.
   * @param {string} widget
   * @param {boolean} [flexibleCall]
   * @returns {string}
   */
  buildController: function(widget, flexibleCall) {
    flexibleCall = flexibleCall || false;
    const pattern = /^w|s|mw/;

    if (this.getApiType() == this.API_VC) {
      if (!widget.match(pattern)) {
        return this.VC_CONTROLLER;
      }
    } else if (this.getApiType() === this.API_GOODS) {
      if (!flexibleCall && !widget.match(pattern)) {
        return this.GOODS_CONTROLLER;
      }
    } else {
      return this.CART_CONTROLLER;
    }

    return '';
  }
});

module.exports = Widget;
