#!/usr/bin/env node
const Bundle = require('bare-bundle')
const fs = require('fs')
const path = require('path')
const { command, flag, arg, summary } = require('paparam')
const process = require('process')
const { pathToFileURL } = require('url')
const pkg = require('./package')
const { createRequire } = require('node:module')

function readBundleFromFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err)
      else resolve(Bundle.from(data))
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

function defaultFormat(out) {
  if (typeof out !== 'string') return 'bundle'
  if (out.endsWith('.bundle.js') || out.endsWith('.bundle.cjs'))
    return 'bundle.cjs'
  if (out.endsWith('.bundle.mjs')) return 'bundle.mjs'
  if (out.endsWith('.bundle.json')) return 'bundle.json'
  return 'bundle'
}

const cmd = command(
  pkg.name,
  summary(pkg.description),
  arg('[file]', 'File containing the bundle (will process stdin if omitted)'),
  flag('--encoding|-e <name>', 'The encoding to use for text bundle formats'),
  flag('--format|-f <name>', 'The bundle format to use'),
  flag('--version|-v', 'Print the current version'),
  flag('--plugin <path>', 'A list of plugins to run on the bundle').multiple(),
  flag('--out|-o <path>', 'The output path of the transformed bundle'),
  async (cmd) => {
    const {
      version,
      plugin: pluginSources,
      out,
      encoding = 'utf8',
      format = defaultFormat(out)
    } = cmd.flags
    const { file } = cmd.args

    if (version) return console.log(`v${pkg.version}`)

    // validate format option early so we can bail out if invalid
    if (
      !['bundle', 'bundle.cjs', 'bundle.mjs', 'bundle.json'].includes(format)
    ) {
      throw new Error(`Unknown format '${format}'`)
    }

    const cwd = process.cwd()

    // creates a require that acts as if we're in the cwd
    const relRequire = createRequire(path.join(cwd, 'mock-file.js'))

    const plugins = (pluginSources || []).map((src) => {
      return relRequire(src)
    })

    let bundle
    if (file) {
      bundle = await readBundleFromFile(path.join(cwd, file))
    } else {
      bundle = await readBundleFromStdin()
    }

    const transformationsInProgress = []
    for (const [name, data, mode] of bundle) {
      for (const plugin of plugins) {
        const result = plugin(bundle, { name, data, mode })
        if (result instanceof Promise) {
          transformationsInProgress.push(result)
        }
      }
    }
    await Promise.all(transformationsInProgress)

    let data = bundle.toBuffer()
    switch (format) {
      case 'bundle':
        break
      case 'bundle.cjs':
        data = `module.exports = ${JSON.stringify(data.toString(encoding))}\n`
        break
      case 'bundle.mjs':
        data = `export default ${JSON.stringify(data.toString(encoding))}\n`
        break
      case 'bundle.json':
        data = JSON.stringify(data.toString(encoding)) + '\n'
        break
      default:
        // NB: line will never be hit, kept for legibility/intent when refactoring
        throw new Error(`Unknown format '${format}'`)
    }

    if (out) {
      const url = pathToFileURL(out)
      await fs.promises.mkdir(new URL('.', url), { recursive: true })
      await fs.promises.writeFile(url, data)
    } else {
      process.stdout.write(data)
    }
  }
)

cmd.parse()
