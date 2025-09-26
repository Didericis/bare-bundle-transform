/**
 * Matches any unicode character between "foo" and "bar"
 * @param {string} str
 * @returns {boolean}
 */
function fooBar(str) {
  return str.match(/\p{L}/gu)
}

module.exports = fooBar
