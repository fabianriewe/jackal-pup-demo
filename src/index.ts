import * as fs from 'node:fs'
import {MnemonicWallet, WalletHandler} from '@jackallabs/jackal.nodejs'
import EasyJackal from "./easy-jackal";


(async function main() {
  // specify your mnemonic and the filename you want to upload
  const mnemonic = 'capital chunk piano supreme photo beef age boy retire vote kitchen under'
  const fileName = 'kyve-test.toml.txt'
  // TODO: Need explanation from team what this is
  const sampleDir = 'Node3'

  // Add configuration for testnet
  // TODO: could be move to class for easier coding
  const testnet = {
    signerChain: 'lupulella-2',
    queryAddr: 'https://testnet-grpc.jackalprotocol.com',
    txAddr: 'https://testnet-rpc.jackalprotocol.com'
  }

  // Todo: Clarify if EasyJackal should take in a wallet or just an IMnemonicWallet
  const mnemonicWallet = await MnemonicWallet.create(mnemonic)
  const wallet = await WalletHandler.trackWallet(testnet, mnemonicWallet)

  const jackal: EasyJackal = new EasyJackal(wallet)

  // Uploading data
  const data: Buffer = fs.readFileSync(`./test-files/${fileName}`)
  await jackal.upload(data, fileName, sampleDir)

  // Downloading data
  const fileContent: ArrayBuffer = await jackal.download(sampleDir, fileName)

  fs.writeFileSync(
    `./test-files/dl/${fileName}`,
    new Uint8Array(fileContent),
    {}
  )
})()
