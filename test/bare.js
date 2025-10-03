const { spawn } = require('child_process')
const test = require('brittle')
const path = require('path')

// NOTE: these tests assumes that the bundle has been transformed (see test:build-bundles npm script)

test('app bundle compiled with no plugins', async (t) => {
  await t.exception(async () => {
    await new Promise((resolve, reject) => {
      const p = spawn('bare', [
        '--eval',
        `require(${path.join(__dirname, 'bundles/default.bundle')})`
      ])
      let err = Buffer.alloc(0)
      p.stderr.on('data', (d) => {
        err = Buffer.concat([err, d])
      })
      p.stderr.on('close', () => {
        reject(err.toString())
      })
    })
  }, /Uncaught SyntaxError: Invalid regular expression/)
})

test('app bundle compiled with the local-babel plugin', (t) => {
  const { foo, fooBar } = require('./bundles/local-babel.bundle')

  // checks if we've fixed the problematic package
  const match = fooBar('A ბ ㄱ')
  t.alike(match, ['A', 'ბ', 'ㄱ'])

  // ensures we haven't broken the other package
  t.is(foo(), 'bar')
})

test('app bundle compiled with the bare-bundle-transform-babel-plugin', (t) => {
  const { foo, fooBar } = require('./bundles/babel.bundle')

  // checks if we've fixed the problematic package
  const match = fooBar('A ბ ㄱ')
  t.alike(match, ['A', 'ბ', 'ㄱ'])

  // ensures we haven't broken the other package
  t.is(foo(), 'bar')
})
