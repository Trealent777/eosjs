const ecc = require('eosjs-ecc')
const json = require('eosjs-json')
const Fcbuffer = require('fcbuffer')

const Testnet = require('eosjs-api/testnet')
const api = require('eosjs-api')

const Structs = require('./src/structs')
const writeApiGen = require('./src/write-api')

/**
  config.network = Testnet() must be supplied until Mainnet is available..

  @arg {object} [config.network = Mainnet()]
*/
const Eos = (config = {}) => {
  const network = config.network //|| Mainnet()

  const structs = Structs(config)

  return {
    structs
  }
}

function throwOnDuplicate(o1, o2, msg) {
  for(const key in o1) {
    if(o2[key]) {
      throw new TypeError(msg + ': ' + key)
    }
  }
}

/**
  @arg {object} network - all read-only api calls
  @return {object} - read-only api calls and write method calls (create and sign transactions)
  @throw {TypeError} if a funciton name conflicts
*/
function mergeWriteFunctions(config = {}, Network) {

  // limit signProvider's scope as much as possible
  const signProvider = config.signProvider
  config = Object.assign({}, config)
  delete config.signProvider

  const network = Network(config)
  config = Object.assign(config, {network})

  const eos = Eos(config)
  let merge = Object.assign({}, eos)

  throwOnDuplicate(merge, network, 'Conflicting methods in Eos and Network Api')
  merge = Object.assign(merge, network)

  if(signProvider) {
    const writeApi = writeApiGen(Network, network, eos.structs, signProvider)
    throwOnDuplicate(merge, writeApi, 'Conflicting methods in Eos and Transaction Api')
    merge = Object.assign(merge, writeApi)
  }

  return merge
}

Eos.Testnet = config => mergeWriteFunctions(config, Testnet)
// Eos.Mainnet = config => mergeWriteFunctions(config, Mainnet(config))

Eos.modules = {
  json,
  ecc,
  api,
  Fcbuffer
}

module.exports = Eos
