import type { Dish, Season } from './types'

export function seasonForDate(date: Date): Season {
  const month = date.getMonth() + 1
  if (month === 12 || month <= 2) return 'hiver'
  if (month <= 5) return 'printemps'
  if (month <= 8) return 'ete'
  return 'automne'
}

export function seasonForWeek(weekStart: string): Season {
  return seasonForDate(new Date(`${weekStart}T00:00:00Z`))
}

const FIXED_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: 'Jour de l\u2019An' },
  { month: 5, day: 1, name: 'Fête du Travail' },
  { month: 5, day: 8, name: 'Victoire 1945' },
  { month: 7, day: 14, name: 'Fête nationale' },
  { month: 8, day: 15, name: 'Assomption' },
  { month: 11, day: 1, name: 'Toussaint' },
  { month: 11, day: 11, name: 'Armistice' },
  { month: 12, day: 25, name: 'Noël' },
]

export interface Holiday {
  date: string
  name: string
}

export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

export function frenchHolidays(year: number): Holiday[] {
  const easter = easterSunday(year)
  const toKey = (date: Date) => date.toISOString().slice(0, 10)
  const movable: Holiday[] = [
    { date: toKey(addDays(easter, 1)), name: 'Lundi de Pâques' },
    { date: toKey(addDays(easter, 39)), name: 'Ascension' },
    { date: toKey(addDays(easter, 50)), name: 'Lundi de Pentecôte' },
  ]
  const fixed = FIXED_HOLIDAYS.map((holiday) => ({
    date: `${year}-${String(holiday.month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`,
    name: holiday.name,
  }))
  return [...fixed, ...movable].sort((a, b) => a.date.localeCompare(b.date))
}

export function holidaysInWeek(weekStart: string): Holiday[] {
  const start = new Date(`${weekStart}T00:00:00Z`)
  const year = start.getUTCFullYear()
  const weeks = [frenchHolidays(year)]
  if (start.getUTCMonth() === 11) {
    weeks.push(frenchHolidays(year + 1))
  }
  const end = addDays(start, 6)
  return weeks
    .flat()
    .filter((holiday) => {
      const date = new Date(`${holiday.date}T00:00:00Z`)
      return date >= start && date <= end
    })
}

export function isDishInSeason(dish: Pick<Dish, 'seasons'>, season: Season): boolean {
  return dish.seasons.length === 0 || dish.seasons.includes(season)
}
