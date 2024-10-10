import type { PlantInfo } from '@/views/plantsRepo'
import dayjs from 'dayjs'

export function format(date: Date): string {
  const timeZoneDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
  return (
    timeZoneDate.getDate() +
    '.' +
    (timeZoneDate.getMonth() + 1) +
    ' - ' +
    timeZoneDate.getHours() +
    ':' +
    (timeZoneDate.getMinutes() < 10 ? '0' : '') +
    timeZoneDate.getMinutes()
  )
}

export function timezoned(date: Date): Date {
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000)
}

export function date(date: Date): string {
  return `${leadingZero(date.getDate())}.${leadingZero(date.getMonth() + 1)}`
}

function leadingZero(n: number): string {
  return (n < 10 ? '0' : '') + n.toString()
}

export function nextWatering(plant: PlantInfo): string {
  return dayjs(plant.nextWatering?.toDate()).format('DD.MM')
}

export function daysLeft(plant: PlantInfo): number {
  return dayjs(plant.nextWatering?.toDate()).diff(new Date(), 'days')
}

export function getNextWateringText(plantInfo: PlantInfo) {
  if (!plantInfo.nextWatering) return 'Nicht genug daten'
  const next = dayjs(plantInfo.nextWatering.toDate())
  const nextFormatted = next.format('DD.MM.YY')

  const isPast = next.isBefore(new Date())
  const diffDays = Math.abs(next.diff(new Date(), 'days'))
  const divWord = isPast ? 'vor' : 'in'

  return `${nextFormatted} ${divWord} ${diffDays} Tagen`
}
