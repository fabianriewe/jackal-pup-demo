import * as fs from 'node:fs'
import type {IFileDownloadHandler, IFileIo, IUploadList} from '@jackallabs/jackal.nodejs'
import {FileUploadHandler, IWalletHandler, MnemonicWallet, WalletHandler} from '@jackallabs/jackal.nodejs'


class EasyJackal {

  wallet: IWalletHandler

  constructor(wallet: IWalletHandler) {
    this.wallet = wallet
  }

  async getFileIO(): Promise<IFileIo> {
    const fileIo = await this.wallet.makeFileIoHandler('1.1.x')
    if (!fileIo) throw new Error('no FileIo')
    return fileIo
  }

  // if owner is null,  we assume it's the users
  async download(path: string, fileName: string, owner: string | null = null): Promise<ArrayBuffer> {
    const fileIo = await this.getFileIO()

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

  async upload(data: Buffer, fileName: string, directory: string) {
    const fileIo = await this.getFileIO()

    fileIo.forceProvider({
      address: 'string',
      ip: 'https://testnet5.jwillette.net',
      totalspace: 'string',
      burnedContracts: 'string',
      creator: 'string',
      keybaseIdentity: 'string',
      authClaimers: []
    })

    await fileIo.generateInitialDirs(null, [directory])

    await fileIo.verifyFoldersExist([directory])
    const dir = await fileIo.downloadFolder("s/" + directory)

    const toUpload = new File([data], fileName, {type: "text/plain"});

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
