'use client'
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Home() {
  const [user, setUser] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [skins, setSkins] = useState([]) // buat nampung list skin

  useEffect(() => {
    // Cek user login
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) getSkins(user.id) // kalo udah login, langsung ambil skinnya
    })

    // Dengerin perubahan login/logout
    supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user?? null
      setUser(currentUser)
      if (currentUser) {
        getSkins(currentUser.id) // ambil skin abis login
      } else {
        setSkins([]) // kosongin kalo logout
      }
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

  // FUNGSI BUAT AMBIL LIST SKIN DARI FOLDER USER
  async function getSkins(userId) {
    const { data, error } = await supabase.storage
   .from('skins') // GANTI 'skins' JADI NAMA BUCKET LU
   .list(userId, { limit: 100 })

    if (error) {
      console.log('Error ambil skin:', error)
    } else {
      setSkins(data)
    }
  }

  async function handleUpload() {
    if (!file ||!user) return alert('Login dulu atau pilih file dulu')
    setLoading(true)

    const fileName = `${Date.now()}_${file.name}`
    const { error } = await supabase.storage
   .from('skins') // GANTI 'skins' JADI NAMA BUCKET LU
   .upload(`${user.id}/${fileName}`, file)

    setLoading(false)
    if (error) {
      alert('Gagal upload: ' + error.message)
    } else {
      alert('Sukses upload!')
      setFile(null)
      getSkins(user.id) // refresh list skin abis upload
    }
  }

  // FUNGSI BUAT AMBIL URL GAMBAR
  function getImageUrl(fileName) {
    const { data } = supabase.storage
   .from('skins') // GANTI 'skins' JADI NAMA BUCKET LU
   .getPublicUrl(`${user.id}/${fileName}`)
    
    return data.publicUrl
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
      <button onClick={logout}>Logout</button>
      <br /><br />
      
      <h2>Upload Skins</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={handleUpload} disabled={loading}>
        {loading? 'Uploading...' : 'Upload'}
      </button>

      <br /><br />
      <h2>Skin Milik Lu:</h2>
      {skins.length === 0? <p>Belum ada skin. Upload dulu gih.</p> : (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {skins.map((skin) => (
            <div key={skin.name}>
              <img 
                src={getImageUrl(skin.name)} 
                alt={skin.name}
                style={{ width: 150, height: 150, objectFit: 'cover' }}
              />
              <p>{skin.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
