'use strict';

const http = require('http');
const https = require('https');
const Response = require('./Response/Abstract');

/**
 * Perform an HTTP or HTTPS POST and parse each JSON data chunk.
 *
 * @param {Object} options          - Request options (hostname, path, headers, etc.).
 * @param {string} data             - Stringified POST body.
 * @param {boolean} isHttps         - Whether to use HTTPS (true) or HTTP (false).
 * @param {function(Response):void} callback  - Invoked with a Response instance for each data chunk.
 */
function runAction(options, data, isHttps, callback) {
  options.port = isHttps ? 443 : 80;
  const client = isHttps ? https : http;

  const req = client.request(options, res => {
    res.setEncoding('utf8');
    res.on('data', chunk => {
      const json = JSON.parse(chunk);
      const response = new Response(json, chunk);
      callback(response);
    });
  });

  req.write(data);
  req.end();
}

module.exports = { runAction };
