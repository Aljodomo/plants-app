import { doc, getDoc, updateDoc, Timestamp, onSnapshot } from 'firebase/firestore'
import { ref } from 'vue'
import { firestore } from './firestore'

const plantColName = 'plants'

export interface PlantInfo {
  name: string
  telegramChatId: string,
  wateringTimestamps: Timestamp[]
}

export async function findPlantRef(plantId: string) {

  const docRef = doc(firestore, plantColName, plantId)

  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const plantInfoRef = ref<PlantInfo>(docSnap.data() as PlantInfo)

    const unsub = onSnapshot(docRef, (doc) => {
      plantInfoRef.value = doc.data() as PlantInfo
    })

    return {
      ref: plantInfoRef,
      unsub: unsub
    }
  } else {
    throw new Error('No such document! id: ' + plantId)
  }
}

export async function savePlantInfo(plantId: string, plantInfo: PlantInfo) {
  const docRef = doc(firestore, plantColName, plantId)
  return await updateDoc(docRef, {
    name: plantInfo.name,
  })
}