import { getDownloadURL, getStorage, ref, uploadBytes, deleteObject } from 'firebase/storage'
import { type PlantInfo, savePlantInfo } from '@/views/plantsRepo'

const storage = getStorage()

function getRef(url: string) {
  return ref(storage, url)
}

function getImageRef(imageName: string) {
  return getRef(`images/${imageName}`)
}

export async function uploadImage(imageName: string, file: Blob) {
  const ref = getImageRef(imageName)
  return uploadBytes(ref, file)
}

export async function uploadPlantImage(plantInfo: PlantInfo, file: File) {
  const res = await uploadImage(plantInfo.id, file)
  plantInfo.imageUrl = await getDownloadURL(res.ref)
  await savePlantInfo(plantInfo.id, plantInfo)
  return plantInfo
}

export async function deletePlantImage(plantInfo: PlantInfo) {
  const ref = getImageRef(plantInfo.id)
  await deleteObject(ref)
  plantInfo.imageUrl = null
  await savePlantInfo(plantInfo.id, plantInfo)
}
