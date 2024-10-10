import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  Timestamp,
  type Unsubscribe,
  updateDoc
} from 'firebase/firestore'
import { ref } from 'vue'
import { firestore } from './firestore'
import { v4 as uuidv4 } from 'uuid'
import { vi } from 'vuetify/locale'

const plantColName = 'plants'

export enum Humidity {
  WET = 'WET',
  MOIST = 'MOIST',
  DRY = 'DRY',
  VERY_DRY = 'VERY_DRY'
}

export interface Visit {
  id: string
  timestamp: Timestamp
  wasWatered: boolean
  soilHumidity: Humidity
}

export interface PlantInfo {
  id: string
  name: string
  visits: Visit[]
  nextWatering?: Timestamp
  preferedHumidy?: Humidity
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

export async function createPlant(plantId: string, name: string, preferedHumidy: Humidity) {
  const docRef = doc(firestore, plantColName, plantId)

  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    throw new Error('Plant with given id already exists. id:' + plantId)
  } else {
    const plantInfo: PlantInfo = {
      id: plantId,
      name: name,
      preferedHumidy: preferedHumidy,
      visits: []
    }
    await setDoc(docRef, plantInfo)
    return plantInfo
  }
}

export async function getAllPlantsRef() {
  const plantsRef = ref<PlantInfo[]>([])

  const col = collection(firestore, plantColName)

  // Wait for first onSnapshot callback to resolve this promise
  const unsub: Unsubscribe = await new Promise((resolve) => {
    const unsub = onSnapshot(col, (querySnapshot) => {
      const docChanges = querySnapshot.docChanges()
      for (const docChange of docChanges) {
        const plantInfo = docChange.doc.data() as PlantInfo
        switch (docChange.type) {
          case 'added': {
            plantsRef.value.push(plantInfo)
            break
          }
          case 'removed': {
            plantsRef.value.splice(
              plantsRef.value.findIndex((pl) => pl.id === plantInfo.id),
              1
            )
            break
          }
          case 'modified': {
            plantsRef.value[plantsRef.value.findIndex((pl) => pl.id === plantInfo.id)] = plantInfo
            break
          }
        }
      }
      resolve(unsub)
    })
  })

  return {
    plantsRef,
    unsub
  }
}

export async function savePlantInfo(plantId: string, plantInfo: PlantInfo) {
  const docRef = doc(firestore, plantColName, plantId)
  return await updateDoc(docRef, {
    name: plantInfo.name,
    preferedHumidy: plantInfo.preferedHumidy
  })
}

export function getHumidityText(humidity: Humidity) {
  switch (humidity) {
    case Humidity.WET:
      return 'Nass'
    case Humidity.MOIST:
      return '3cm feucht'
    case Humidity.DRY:
      return '3cm trocken'
    case Humidity.VERY_DRY:
      return 'Vollst. abgetrocknet'
  }
}

export async function setVisitData(
  plantId: string,
  visitId: string,
  data: { humidity?: Humidity; wasWatered?: boolean; timestamp: Date }
) {
  if (!plantId) {
    throw new Error('No plant id provided')
  }
  if (!visitId) {
    throw new Error('No visit id provided')
  }
  if (!data) {
    throw new Error('No data provided')
  }

  const docRef = doc(firestore, plantColName, plantId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const plantInfo = docSnap.data() as PlantInfo

    if (!plantInfo.visits.some((visit) => visit.id === visitId)) {
      throw new Error('No visit found with given id! id: ' + visitId)
    }

    const visit = plantInfo.visits.find((visit) => visit.id === visitId)!

    if (data.humidity !== undefined) {
      visit.soilHumidity = data.humidity
    }
    if (data.wasWatered !== undefined) {
      visit.wasWatered = data.wasWatered
    }
    if (data.timestamp !== undefined) {
      visit.timestamp = Timestamp.fromDate(data.timestamp)
    }

    await setDoc(docRef, plantInfo)
  } else {
    throw new Error('No such document! id: ' + plantId)
  }
}

export async function getVisitHumidity(plantId: string, visitId: string): Promise<Humidity> {
  if (!plantId) {
    throw new Error('No plant id provided')
  }

  const docRef = doc(firestore, plantColName, plantId)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    const plantInfo = docSnap.data() as PlantInfo

    if (!plantInfo.visits.some((visit) => visit.id === visitId)) {
      throw new Error('No visit found with given id! id: ' + visitId)
    }

    const humidity = plantInfo.visits.find((visit) => visit.id === visitId)!.soilHumidity

    return humidity as Humidity
  } else {
    throw new Error('No such document! id: ' + plantId)
  }
}

export async function addVisit(plantId: string) {
  if (!plantId) {
    throw new Error('No plant id provided')
  }

  const docRef = doc(firestore, plantColName, plantId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    throw new Error('Plant does not exist')
  } else {
    const visitId = uuidv4()
    const newVisit: Visit = {
      id: visitId,
      timestamp: Timestamp.now(),
      soilHumidity: Humidity.DRY,
      wasWatered: true
    }

    await updateDoc(docRef, {
      visits: arrayUnion(newVisit)
    })

    return visitId
  }
}

export async function deletePlant(plantId: string) {
  const docRef = doc(firestore, plantColName, plantId)
  await deleteDoc(docRef)
}

export async function removeVisit(plantId: string, visitId: string) {
  if (!visitId) {
    throw new Error('No visit id provided')
  }

  const { docRef, plantInfo } = await findPlantById(plantId)

  const visitIdx = plantInfo.visits.findIndex((visit) => visit.id === visitId)
  if (visitIdx === -1) {
    throw new Error(`No visit with id ${visitId} found for plant ${plantId}`)
  }
  plantInfo.visits.splice(visitIdx, 1)

  await setDoc(docRef, plantInfo)
}

async function findPlantById(plantId: string) {
  if (!plantId) {
    throw new Error('No plant id provided' + plantId)
  }

  const docRef = doc(firestore, plantColName, plantId)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    const plantInfo = docSnap.data() as PlantInfo
    return {
      docRef,
      plantInfo
    }
  } else {
    throw new Error('No such plant info document id: ' + plantId)
  }
}
