'use strict';

/**
 * Determine the current runtime environment.
 *
 * @returns {'nw'|'node'|'browser'} Identifier for the detected environment.
 * @throws {Error} If the environment cannot be determined.
 */
function checkRuntimeEnv() {
  let runtimeEnv;

  if (typeof process !== 'undefined' && process.versions) {
    if (process.versions.nw) {
      runtimeEnv = 'nw';
    } else if (process.versions.node) {
      runtimeEnv = 'node';
    }
  } else if (typeof window !== 'undefined' && window.window === window) {
    runtimeEnv = 'browser';
    console.warn('Browser is deprecated for this library');
  }

  if (!runtimeEnv) {
    throw new Error('Unknown runtime environment');
  }

  return runtimeEnv;
}

module.exports = {
  checkRuntimeEnv
};
