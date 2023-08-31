import * as fs from 'node:fs'
import type {IFileDownloadHandler, IUploadList} from '@jackallabs/jackal.nodejs'
import {FileUploadHandler, IWalletHandler, MnemonicWallet, WalletHandler} from '@jackallabs/jackal.nodejs'
import ErrnoException = NodeJS.ErrnoException;

const mnemonic = 'capital chunk piano supreme photo beef age boy retire vote kitchen under'
const fileName = 'kyve-test.toml.txt'
const sampleDir = 'Node3'

const signerChain = 'lupulella-2'
const testnet = {
  signerChain,
  queryAddr: 'https://testnet-grpc.jackalprotocol.com',
  txAddr: 'https://testnet-rpc.jackalprotocol.com'
}

async function run() {
  const m = await MnemonicWallet.create(mnemonic)
  const w = await WalletHandler.trackWallet(testnet, m)

  const fileIo = await w.makeFileIoHandler('1.0.9')
  if (!fileIo) throw new Error('no FileIo')

  fileIo.forceProvider({
    address: 'string',
    ip: 'https://testnet5.jwillette.net',
    totalspace: 'string',
    burnedContracts: 'string',
    creator: 'string',
    keybaseIdentity: 'string',
    authClaimers: []
  })

  await fileIo.generateInitialDirs(null, [sampleDir])

  await fileIo.verifyFoldersExist([sampleDir])
  const dir = await fileIo.downloadFolder("s/" + sampleDir)

  fs.readFile(`./test-files/${fileName}`, async function (err: ErrnoException | null, f: Buffer) {
    if (err) console.error(err)
    const toUpload = new File([f], fileName, {type: "text/plain"});

    // @ts-ignore
    const handler = await FileUploadHandler.trackFile(toUpload, dir.getMyPath())

    const uploadList: IUploadList = {}
    uploadList[fileName] = {
      data: null,
      exists: false,
      handler: handler,
      key: fileName,
      uploadable: await handler.getForUpload()
    }

    const tracker = {timer: 0, complete: 0}
    console.log("I AM BEFORE THE UPLOAD")
    await fileIo.staggeredUploadFiles(uploadList, dir, tracker)

    const dirAgain = await fileIo.downloadFolder("s/" + sampleDir)
    const dl = await fileIo.downloadFile({
        rawPath: dirAgain.getMyChildPath(fileName),
        owner: w.getJackalAddress()
      },
      {
        track: 0
      }) as IFileDownloadHandler

    fs.writeFileSync(
      `./test-files/dl/${fileName}`,
      new Uint8Array(await dl.receiveBacon().arrayBuffer()),
      {}
    )
  })
}

async function tryDownload() {
  const m = await MnemonicWallet.create(mnemonic)
  const w = await WalletHandler.trackWallet(testnet, m)
  const fileIo = await w.makeFileIoHandler('1.0.9')
  if (!fileIo) throw new Error('no FileIo')

  const dirAgain = await fileIo.downloadFolder("s/" + sampleDir)
  const dl = await fileIo.downloadFile({
      rawPath: dirAgain.getMyChildPath(fileName),
      owner: w.getJackalAddress()
    },
    {
      track: 0
    }) as IFileDownloadHandler

  fs.writeFileSync(
    `./test-files/dl/${fileName}`,
    new Uint8Array(await dl.receiveBacon().arrayBuffer()),
    {}
  )
}

class EasyJackal {

  wallet: IWalletHandler

  constructor(wallet: IWalletHandler) {

    //    const mnemonicWallet = await MnemonicWallet.create(mnemonic)
    //     const wallet = await WalletHandler.trackWallet(testnet, mnemonicWallet)
    //

    this.wallet = wallet
  }

  // if owner is null,  we assume it's the users
  async downloadFile(path: string, owner: string | null): Promise<ArrayBuffer> {
    const fileIo = await this.wallet.makeFileIoHandler('1.0.9')
    if (!fileIo) throw new Error('no FileIo')

    const directory = await fileIo.downloadFolder("s/" + path)
    const downloadHandler = await fileIo.downloadFile({
        rawPath: directory.getMyChildPath(fileName),
        owner: owner ? owner : this.wallet.getJackalAddress()
      },
      {
        track: 0
      }) as IFileDownloadHandler

    return await downloadHandler.receiveBacon().arrayBuffer()
  }

  async uploadFile(data: Buffer) {
    const m = await MnemonicWallet.create(mnemonic)
    const w = await WalletHandler.trackWallet(testnet, m)

    const fileIo = await w.makeFileIoHandler('1.0.9')
    if (!fileIo) throw new Error('no FileIo')

    fileIo.forceProvider({
      address: 'string',
      ip: 'https://testnet5.jwillette.net',
      totalspace: 'string',
      burnedContracts: 'string',
      creator: 'string',
      keybaseIdentity: 'string',
      authClaimers: []
    })

    await fileIo.generateInitialDirs(null, [sampleDir])

    await fileIo.verifyFoldersExist([sampleDir])
    const dir = await fileIo.downloadFolder("s/" + sampleDir)

    const toUpload = new File([data], fileName, {type: "text/plain"});

    // @ts-ignore
    const handler = await FileUploadHandler.trackFile(toUpload, dir.getMyPath())

    const uploadList: IUploadList = {}
    uploadList[fileName] = {
      data: null,
      exists: false,
      handler: handler,
      key: fileName,
      uploadable: await handler.getForUpload()
    }

    const tracker = {timer: 0, complete: 0}
    await fileIo.staggeredUploadFiles(uploadList, dir, tracker)
  }
}

(async function () {
  await run()
    .then(() => {
      console.log('run() Done')
    })
})()
