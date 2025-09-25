const transpileCode = require('regexpu/transpile-code')

function plugin(bundle, { name, data, mode }) {
  // only transform javascript files
  if (name.match(/\.js$|\.cjs$|\.mjs$/)) {
    const content = data.toString()
    const result = transpileCode(content)
    // overwrite the old code with the transpiled code in the bundle
    bundle.write(name, result, { mode })
  }
}

module.exports = plugin
