import {FileUploadHandler, IFileDownloadHandler, IFileIo, IUploadList, IWalletHandler} from "@jackallabs/jackal.nodejs";

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

export default EasyJackal;
