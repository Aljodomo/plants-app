import chroma from 'chroma-js'
import { Timestamp } from 'firebase/firestore'
import type { PlantInfo } from './plantsRepo'

export function wateringUrgencyColor(plant: PlantInfo | undefined): string {
  if (!plant || !plant.nextWatering) {
    return 'rgba(0,0,0,0)'
  }
  const waterings = plant.visits.filter((visit) => visit.wasWatered === true)
  if (!waterings.length) {
    return 'rgba(0,0,0,0)'
  }
  const lastWatering = waterings[waterings.length - 1].timestamp
  if (lastWatering.seconds > plant.nextWatering.seconds) {
    return 'rgba(0,0,0,0)'
  }
  const now = Timestamp.now()
  const delta = plant.nextWatering.seconds - lastWatering.seconds
  const precent = (now.seconds - lastWatering.seconds) / delta
  return chroma
    .scale(['green', 'yellow', 'orange', 'red'])
    .domain([0, 0.75, 0.9, 1])(precent)
    .toString()
}
