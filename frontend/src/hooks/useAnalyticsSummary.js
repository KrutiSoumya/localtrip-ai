import { useState, useEffect } from 'react'
import { getAnalyticsSummary } from '../services/api'

function useAnalyticsSummary() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false

    const fetch = async () => {
      try {
        setLoading(true)
        const res = await getAnalyticsSummary()
        if (!cancelled) setData(res.data)
      } catch (err) {
        if (!cancelled) {
          // Backend not connected yet — fall back to mock data
          setData({
            totalLeads:       124,
            confirmedBookings: 38,
            conversionRate:   '31%',
            totalRevenue:     '₹4.2L',
            leadsTrend:       '+12% this week',
            bookingsTrend:    '+5 this week',
            conversionTrend:  '-2% this week',
            revenueTrend:     '+18% this month',
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}

export default useAnalyticsSummary