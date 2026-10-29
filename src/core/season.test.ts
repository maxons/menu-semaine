import { describe, expect, it } from 'vitest'
import {
  easterSunday,
  frenchHolidays,
  holidaysInWeek,
  isDishInSeason,
  seasonForDate,
  seasonForWeek,
} from './season'

describe('seasonForDate', () => {
  it('associe les mois aux saisons', () => {
    expect(seasonForDate(new Date('2025-01-15T00:00:00Z'))).toBe('hiver')
    expect(seasonForDate(new Date('2025-04-15T00:00:00Z'))).toBe('printemps')
    expect(seasonForDate(new Date('2025-07-15T00:00:00Z'))).toBe('ete')
    expect(seasonForDate(new Date('2025-10-15T00:00:00Z'))).toBe('automne')
  })
})

describe('seasonForWeek', () => {
  it('utilise le lundi de la semaine', () => {
    expect(seasonForWeek('2025-01-06')).toBe('hiver')
  })
})

describe('easterSunday', () => {
  it('calcule Pâques correctement (2025 : 20 avril)', () => {
    expect(easterSunday(2025).toISOString().slice(0, 10)).toBe('2025-04-20')
  })

  it('calcule Pâques 2024 : 31 mars', () => {
    expect(easterSunday(2024).toISOString().slice(0, 10)).toBe('2024-03-31')
  })
})

describe('frenchHolidays', () => {
  it('contient les fixes et mobiles', () => {
    const holidays = frenchHolidays(2025)
    const names = holidays.map((holiday) => holiday.name)
    expect(names).toContain('Noël')
    expect(names).toContain('Lundi de Pâques')
    expect(names).toContain('Ascension')
    expect(holidays).toHaveLength(11)
  })
})

describe('holidaysInWeek', () => {
  it('trouve Noël dans la semaine du 22 décembre 2025', () => {
    const holidays = holidaysInWeek('2025-12-22')
    expect(holidays.map((holiday) => holiday.name)).toContain('Noël')
  })

  it('ne trouve rien dans une semaine ordinaire', () => {
    expect(holidaysInWeek('2025-03-03')).toHaveLength(0)
  })

  it('trouve le 14 juillet', () => {
    const holidays = holidaysInWeek('2025-07-14')
    expect(holidays.map((holiday) => holiday.name)).toContain('Fête nationale')
  })
})

describe('isDishInSeason', () => {
  it('accepte un plat sans saison', () => {
    expect(isDishInSeason({ seasons: [] }, 'hiver')).toBe(true)
  })

  it('accepte un plat de la saison courante', () => {
    expect(isDishInSeason({ seasons: ['hiver'] }, 'hiver')).toBe(true)
  })

  it('rejette un plat hors saison', () => {
    expect(isDishInSeason({ seasons: ['ete'] }, 'hiver')).toBe(false)
  })
})
