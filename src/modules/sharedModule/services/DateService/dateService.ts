export function toFormatDDMMYYYY(date: Date): string {
    const dateWithZero = `${date.getDate()}`.padStart(2, '0')
    const monthWithZero = `${date.getMonth()}`.padStart(2, '0')
    return `${dateWithZero}/${monthWithZero}/${date.getFullYear()}`
}

export function DDMMYYYYToDate(date: string): Date {
    const splited = date.split('/')
    const year = Number(splited[2])
    const month = Number(splited[1])
    const day = Number(splited[0])
    const utcDate = Date.UTC(year, month, day)
    return new Date(utcDate)
}