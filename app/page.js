'use client'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [session, setSession] = useState(null)
  const [skins, setSkins] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  useEffect(() => {
    if (session) getSkins()
  }, [session])

  async function getSkins() {
    const { data } = await supabase.from('skins').select('*').order('created_at', { ascending: false })
    setSkins(data || [])
  }

  async function uploadSkin(event) {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) return

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`

      let { error: uploadError } = await supabase.storage.from('skins').upload(filePath, file)
      if (uploadError) throw uploadError

      const { error: dbError } = await supabase.from('skins').insert({
        name: file.name,
        file_path: filePath,
        user_id: session.user.id
      })
      if (dbError) throw dbError
      
      getSkins()
    } catch (error) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  async function getSkinUrl(filePath) {
const { data } = supabase.storage.from('skins').getPublicUrl(filePath)
navigator.clipboard.writeText(data.publicUrl)
    alert('URL dicopy! permanen. Tempel di SkinsRestorer: /skin set url [URL]')
  }

  if (!session) {
    return (
      <div style={{ maxWidth: 420, margin: '100px auto', padding: 20 }}>
        <h1>Login Dulu Bro</h1>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} />
      </div>
    )
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1>Skin Server Fajri 🔥</h1>
      <button onClick={() => supabase.auth.signOut()}>Logout</button>
      
      <div style={{ margin: '20px 0' }}>
        <label style={{ background: '#333', padding: 12, borderRadius: 8, cursor: 'pointer' }}>
          {uploading? 'Uploading...' : 'Upload Skin PNG'}
          <input style={{ display: 'none' }} type="file" accept="image/png" onChange={uploadSkin} disabled={uploading} />
        </label>
      </div>

      <h2>Skin Lu:</h2>
      {skins.map((skin) => (
        <div key={skin.id} style={{ background: '#222', padding: 16, margin: '10px 0', borderRadius: 8 }}>
          <b>{skin.name}</b>
          <button onClick={() => getSkinUrl(skin.file_path)} style={{ marginLeft: 10 }}>Copy URL</button>
        </div>
      ))}
    </div>
  )
}
