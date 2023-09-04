import {FileUploadHandler, IFileDownloadHandler, IFileIo, IUploadList, IWalletHandler} from "@jackallabs/jackal.nodejs";

// This class simplifies the usage of JackalJS by a lot
// TODO: Consideration, add a batch upload function
class EasyJackal {

  wallet: IWalletHandler

  constructor(wallet: IWalletHandler) {
    this.wallet = wallet
  }

  // generate the FileIO
  // TODO: Could this be done in sync?
  async getFileIO(): Promise<IFileIo> {
    const fileIo: IFileIo = await this.wallet.makeFileIoHandler('1.1.x')
    // TODO: Can this happen? If yes, why doesn't the `makeFileIoHandler` throw an error?
    if (!fileIo) throw new Error('no FileIo')
    return fileIo
  }

  //TODO: Desired ? If owner is null,  we assume it's the users
  async download(path: string, fileName: string, owner: string | null = null): Promise<ArrayBuffer> {
    const fileIo = await this.getFileIO()

    const directory = await fileIo.downloadFolder("s/" + path)
    // TODO: Can the `completion` be stored by default with 0 to avoid unnecessary code?
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

    // TODO: Is this needed here?
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

    // TODO: Does this function throw an error when it doesn't exist? Why does this return a `number`?
    await fileIo.verifyFoldersExist([directory])
    const dir = await fileIo.downloadFolder("s/" + directory)

    // TODO: The options could be specified in upload function arguments
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

    // TODO: Can the `tracker` be stored by default with 0 to avoid unnecessary code?
    const tracker = {timer: 0, complete: 0}
    await fileIo.staggeredUploadFiles(uploadList, dir, tracker)
    // TODO: Should this function return something on success? Maybe the transaction?
  }
}

export default EasyJackal;
