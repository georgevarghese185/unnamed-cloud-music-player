import { NodeFsDeviceStorage } from '../storage/device/node-fs-device-storage'

const storage = new NodeFsDeviceStorage()

export const listFiles = storage.listFiles.bind(storage)
export const getFile = storage.getFile.bind(storage)
