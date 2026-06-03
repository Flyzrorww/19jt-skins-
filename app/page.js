'use client'
import './globals.css'
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Page() {
  const [user, setUser] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user?? null)
    })
  }, [])

  async function loginWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function handleUpload() {
    if (!file ||!user) return alert('Login dulu atau pilih file dulu')
    setLoading(true)

    // UPLOAD KE FOLDER user.id/namafile.jpg
    const fileName = `${Date.now()}_${file.name}`
    const { error } = await supabase.storage
     .from('skins') // GANTI 'skins' JADI NAMA BUCKET LU
     .upload(`${user.id}/${fileName}`, file)

    setLoading(false)
    if (error) {
      alert('Gagal upload: ' + error.message)
    } else {
      alert('Sukses upload ke folder: ' + user.id)
      setFile(null)
    }
  }

  if (!user) {
    return (
      <div style={{ padding: 50 }}>
        <h1>Login Dulu Sayang</h1>
        <button onClick={loginWithGoogle} style={{ padding: 10, fontSize: 16 }}>
          Login with Google
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: 50 }}>
      <h1>Hai {user.email}</h1>
      <p>User ID lu: {user.id}</p>
      <button onClick={logout}>Logout</button>
      <br /><br />
      
      <h2>Upload Skins</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={handleUpload} disabled={loading}>
        {loading? 'Uploading...' : 'Upload'}
      </button>
    </div>
  )
}
