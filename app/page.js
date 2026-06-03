'use client'
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import './globals.css' // Buat CSS nya

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
    if (session) listSkins()
  }, [session])

  // LIST SKIN DARI STORAGE LANGSUNG
  async function listSkins() {
    const { data, error } = await supabase.storage.from('skins').list(session.user.id, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    })
    if (error) {
      console.log('Error list:', error.message)
      return
    }
    setSkins(data || [])
  }

  async function uploadSkin(event) {
    try {
      setUploading(true)
      if (!event.target.files || event.target.files.length === 0) return

      const file = event.target.files[0]
      if (file.size > 2 * 1024 * 1024) throw new Error('Max 2MB bro!')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${session.user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('skins').upload(filePath, file)
      if (uploadError) throw uploadError

      listSkins() // Refresh list abis upload
    } catch (error) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  // COPY URL PUBLIC
  function copyUrl(fileName) {
    const filePath = `${session.user.id}/${fileName}`
    const { data } = supabase.storage.from('skins').getPublicUrl(filePath)
    navigator.clipboard.writeText(data.publicUrl)
    alert('URL dicopy! Permanen. Tempel di SkinsRestorer: /skin set url [URL]')
  }

  // HAPUS SKIN
  async function deleteSkin(fileName) {
    if (!confirm('Yakin mau hapus skin ini?')) return

    const filePath = `${session.user.id}/${fileName}`
    const { error } = await supabase.storage.from('skins').remove([filePath])
    if (error) {
      alert('Gagal hapus: ' + error.message)
    } else {
      alert('Skin berhasil dihapus')
      listSkins() // refresh list
    }
  }

  if (!session) {
    return (
      <div className="auth-container">
        <h1>Login Dulu Bro 🔥</h1>
        <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]} />
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Skin Server Fajri 🔥</h1>
        <button onClick={() => supabase.auth.signOut()} className="logout-btn">Logout</button>
      </div>

      <div className="upload-box">
        <input type="file" id="fileInput" accept="image/png" hidden onChange={uploadSkin} disabled={uploading} />
        <label htmlFor="fileInput" className="upload-area">
          <p>{uploading? 'Uploading...' : 'Drag & Drop atau Klik untuk Upload'}</p>
          <span>Hanya.png Max 2MB</span>
        </label>
      </div>

      <h2>Skins Lu:</h2>
      <div className="grid">
        {skins.length === 0 && <p>Belom ada skin. Upload dulu!</p>}
        {skins.map((skin) => {
          const { data: urlData } = supabase.storage.from('skins').getPublicUrl(`${session.user.id}/${skin.name}`)
          return (
            <div key={skin.id} className="skin-item">
              <img src={urlData.publicUrl} className="skin-preview" alt={skin.name} />
              <p>{skin.name}</p>
              <button onClick={() => copyUrl(skin.name)}>Copy URL</button>
              <button onClick={() => deleteSkin(skin.name)} className="delete-btn">Hapus</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
