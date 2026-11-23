import { useMemo } from 'react'

const GUIDE_VIDEO_URL = 'https://raw.githubusercontent.com/krithi575/pp_images/main/guide.mp4'
const GUIDE_HELP_PHONE = 'Add your agency contact number here'

const topics = [
  'Add a new lead with the traveler’s details.',
  'Create an itinerary for the trip.',
  'Prepare a quotation for the traveler.',
  'Send the quotation and confirm the booking.',
  'Prepare the invoice for payment after the trip.',
]

export default function Guide() {
  const contact = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      return user.phone || user.phoneNumber || user.phone_number || GUIDE_HELP_PHONE
    } catch {
      return GUIDE_HELP_PHONE
    }
  }, [])
  const phoneDigits = String(contact).replace(/\D/g, '')

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px 40px', color: '#3b0c18' }}>
      <header style={{ marginBottom: '22px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', color: '#5e1a26' }}>The K2K Experience Guide</h1>
        <p style={{ margin: '8px 0 0', color: '#71645b' }}>Watch this short video to learn how to use The K2K Experience.</p>
      </header>

      <video
        controls
        playsInline
        preload="metadata"
        aria-label="LocalTrip AI walkthrough video"
        style={{ display: 'block', width: '100%', aspectRatio: '16 / 9', objectFit: 'contain', background: '#1d1515', borderRadius: '12px' }}
      >
        <source src={GUIDE_VIDEO_URL} type="video/mp4" />
        Your browser does not support video playback.
      </video>

      <section style={{ marginTop: '24px', padding: '20px', border: '1px solid #e5dac8', borderRadius: '12px', background: '#fffdf9' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '20px', color: '#5e1a26' }}>What you’ll learn</h2>
        <ul style={{ margin: 0, paddingLeft: '22px', display: 'grid', gap: '8px', color: '#51443d' }}>
          {topics.map((topic) => <li key={topic}>{topic}</li>)}
        </ul>
        <h3 style={{ margin: '20px 0 8px', fontSize: '17px', color: '#5e1a26' }}>Quick written guide</h3>
        <p style={{ margin: 0, lineHeight: 1.7, color: '#51443d' }}>
          Start by adding the traveler as a lead. Build and review their itinerary, then make and send a quotation. Once they agree, turn it into a booking. After the trip, prepare the invoice and collect payment.
        </p>
      </section>

      <p style={{ margin: '18px 0 0', color: '#51443d', fontSize: '14px' }}>
        Need help? Contact your agency: {phoneDigits
          ? <a href={`https://wa.me/${phoneDigits}`} style={{ color: '#5e1a26', fontWeight: 600 }}>{contact} on WhatsApp</a>
          : <span>{contact}</span>}
      </p>
    </main>
  )
}
