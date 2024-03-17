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
