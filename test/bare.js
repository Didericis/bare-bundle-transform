const test = require('brittle')
// NOTE: this assumes that the bundle has been transformed (see test:transform npm script)
const { foo, fooBar } = require('./support/app.bundle')

test('main', (t) => {
  // checks if we've fixed the problematic package
  const match = fooBar('foo🦾bar')
  t.is(match[1], '🦾')

  // ensures we haven't broken the other package
  t.is(foo(), 'bar')
})
