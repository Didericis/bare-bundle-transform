const babel = require('@babel/core')

async function plugin(bundle, { name, data, mode }) {
  return new Promise((resolve, reject) => {
    // only transform javascript files
    if (name.match(/\.js$|\.cjs$|\.mjs$/)) {
      babel.transform(
        data.toString(),
        {
          plugins: ['@babel/plugin-transform-unicode-regex']
        },
        (err, result) => {
          if (err) reject(err)
          // overwrite the old code with the transpiled code in the bundle
          bundle.write(name, result.code, { mode })
          resolve()
        }
      )
    } else {
      resolve()
    }
  })
}

module.exports = plugin
