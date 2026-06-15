import { createContext, useContext, useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Configurações padrão para cada unidade
const UNIT_DEFAULTS = {
  nomade: {
    id: 'nomade',
    name: 'Nômade',
    fullName: 'Nômade Bar & Restaurante',
    colors: {
      primary: '#1A1A1A',
      secondary: '#C9A96E',
      accent: '#2D2D2D',
      light: '#F5F0E8',
    },
    logo: null,
    address: 'Rua Pedroso Alvarenga, 1170 — Itaim Bibi, São Paulo',
    instagram: '@no.made',
    whatsapp: '11999999999',
    cssClass: 'unit-nomade',
  },
  manga: {
    id: 'manga',
    name: 'Pé de Manga',
    fullName: 'Pé de Manga Bar & Restaurante',
    colors: {
      primary: '#2D5016',
      secondary: '#F5E6C8',
      accent: '#4A7A26',
      light: '#F9F4EE',
    },
    logo: null,
    address: 'Rua Wisard, 489 — Vila Madalena, São Paulo',
    instagram: '@pedemanga',
    whatsapp: '11988888888',
    cssClass: 'unit-manga',
  },
}

const UnitContext = createContext(null)

export function UnitProvider({ children }) {
  const [units, setUnits] = useState(UNIT_DEFAULTS)
  const [loadingUnits, setLoadingUnits] = useState(true)

  useEffect(() => {
    // Tenta carregar configurações customizadas do Firestore
    const loadUnits = async () => {
      try {
        const [nomadeDoc, mangaDoc] = await Promise.all([
          getDoc(doc(db, 'units', 'nomade')),
          getDoc(doc(db, 'units', 'manga')),
        ])

        setUnits({
          nomade: nomadeDoc.exists()
            ? { ...UNIT_DEFAULTS.nomade, ...nomadeDoc.data() }
            : UNIT_DEFAULTS.nomade,
          manga: mangaDoc.exists()
            ? { ...UNIT_DEFAULTS.manga, ...mangaDoc.data() }
            : UNIT_DEFAULTS.manga,
        })
      } catch {
        // Usa defaults se não conseguir carregar
        setUnits(UNIT_DEFAULTS)
      } finally {
        setLoadingUnits(false)
      }
    }
    loadUnits()
  }, [])

  const getUnit = (unitId) => units[unitId] || null

  return (
    <UnitContext.Provider value={{ units, getUnit, loadingUnits }}>
      {children}
    </UnitContext.Provider>
  )
}

export function useUnit(unitId) {
  const ctx = useContext(UnitContext)
  if (!ctx) throw new Error('useUnit must be used within UnitProvider')
  if (unitId) return ctx.getUnit(unitId)
  return ctx
}

export { UNIT_DEFAULTS }
