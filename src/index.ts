import * as fs from 'node:fs'
import {MnemonicWallet, WalletHandler} from '@jackallabs/jackal.nodejs'
import EasyJackal from "./easy-jackal";


(async function main() {
  const mnemonic = 'capital chunk piano supreme photo beef age boy retire vote kitchen under'
  const fileName = 'kyve-test.toml.txt'
  const sampleDir = 'Node3'

  const testnet = {
    signerChain: 'lupulella-2',
    queryAddr: 'https://testnet-grpc.jackalprotocol.com',
    txAddr: 'https://testnet-rpc.jackalprotocol.com'
  }

  const mnemonicWallet = await MnemonicWallet.create(mnemonic)
  const wallet = await WalletHandler.trackWallet(testnet, mnemonicWallet)

  const jackal = new EasyJackal(wallet)

  const data = fs.readFileSync(`./test-files/${fileName}`)

  await jackal.upload(data, fileName, sampleDir)

  const fileContent: ArrayBuffer = await jackal.download(sampleDir, fileName)

  fs.writeFileSync(
    `./test-files/dl/${fileName}`,
    new Uint8Array(fileContent),
    {}
  )
})()
