/**
 * Matches any unicode character between "foo" and "bar"
 * @param {string} str
 * @returns {boolean}
 */
function fooBar(str) {
  return str.match(/foo(.)bar/u)
}

module.exports = fooBar
