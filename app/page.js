'use client'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [skins, setSkins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSkins()
  }, [])

  async function getSkins() {
    const { data } = await supabase.from('skins').select('*')
    setSkins(data || [])
    setLoading(false)
  }

  return (
    <div style={{padding: 20, background: '#111', color: 'white', minHeight: '100vh'}}>
      <h1 style={{fontSize: 40, fontWeight: 'bold'}}>Fajri Skins 🔥</h1>
      <p style={{color: '#aaa', marginBottom: 20}}>Jual Skin Game Private - 19JT READY</p>
      
      {loading ? <p>Loading...</p> : 
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20}}>
          {skins.length === 0 ? <p>Belum ada skin. Tambah di Supabase dulu.</p> :
          skins.map(skin => (
            <div key={skin.id} style={{border: '1px solid #333', borderRadius: 12, padding: 16}}>
              <img src={skin.image_url} style={{width: '100%', borderRadius: 8}} />
              <h3 style={{marginTop: 10}}>{skin.name}</h3>
              <p style={{color: '#4ade80', fontWeight: 'bold'}}>Rp {skin.price?.toLocaleString()}</p>
              <a href={`https://wa.me/628xxxx?text=Mau beli ${skin.name}`} 
                 style={{background: '#25D366', padding: '8px 12px', borderRadius: 8, display: 'block', textAlign: 'center', color: 'white', textDecoration: 'none', marginTop: 10}}>
                 Beli via WA
              </a>
            </div>
          ))}
        </div>
      }
    </div>
  )
}