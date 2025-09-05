#!/usr/bin/env node
const Bundle = require('bare-bundle')
const fs = require('fs')
const { command, flag, arg, summary } = require('paparam')
const process = require('process')
const { pathToFileURL } = require('url')
const pkg = require('./package')

function readBundleFromFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err)
      else resolve(Buffer.from(data))
    })
  })
}

function readBundleFromStdin() {
  return new Promise((resolve, reject) => {
    let fullStdin = Buffer.alloc(0)

    process.stdin.on('data', (chunk) => {
      fullStdin = Buffer.concat([fullStdin, chunk])
    })

    process.stdin.on('end', () => {
      resolve(Bundle.from(fullStdin))
    })

    process.stdin.on('error', reject)
  })
}

const cmd = command(
  pkg.name,
  summary(pkg.description),
  arg('[file]', 'File containing the bundle (will process stdin if omitted)'),
  flag('--version|-v', 'Print the current version'),
  flag('--plugin <path>', 'A list of plugins to run on the bundle').multiple(),
  flag('--out|-o <path>', 'The output path of the transformed bundle'),
  async (cmd) => {
    const { file } = cmd.args
    const { version, plugin: pluginFiles, out } = cmd.flags
    if (version) return console.log(`v${pkg.version}`)

    const plugins = (pluginFiles || []).map(require)

    let bundle
    if (file) {
      bundle = await readBundleFromFile(file)
    } else {
      bundle = await readBundleFromStdin()
    }

    for (const [name, data, mode] of bundle) {
      for (const plugin of plugins) {
        plugin(bundle, { name, data, mode })
      }
    }

    if (out) {
      const url = pathToFileURL(out)
      await fs.promises.mkdir(new URL('.', url), { recursive: true })
      await fs.promises.writeFile(url, bundle.toBuffer())
    } else {
      process.stdout.write(bundle.toBuffer())
    }
  }
)

cmd.parse()
