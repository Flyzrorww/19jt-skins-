'use client'
import './globals.css'
import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function Page() {
  const [skins, setSkins] = useState([])
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchSkins()
  }, [])

  const fetchSkins = async () => {
    const { data } = await supabase.from('skins').select('*').order('created_at', { ascending: false })
    setSkins(data || [])
  }

  const handleUpload = async () => {
    if (!file) return alert('Pilih file dulu bro')
    setLoading(true)

    const fileName = `${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage.from('skins').upload(fileName, file)

    if (uploadError) {
      alert('Upload gagal: ' + uploadError.message)
      setLoading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('skins').getPublicUrl(fileName)

    await supabase.from('skins').insert({ name: fileName, url: publicUrl })

    setFile(null)
    document.getElementById('fileInput').value = null
    fetchSkins()
    setLoading(false)
    alert('Upload berhasil!')
  }

  const handleDelete = async (fileName) => {
    if (!confirm('Yakin mau hapus skin ini?')) return

    // 1. Hapus dari Storage
    const { error: storageError } = await supabase.storage.from('skins').remove([fileName])
    if (storageError) return alert('Gagal hapus file: ' + storageError.message)

    // 2. Hapus dari Database
    const { error: dbError } = await supabase.from('skins').delete().eq('name', fileName)
    if (dbError) return alert('Gagal hapus data: ' + dbError.message)

    // 3. Refresh list
    fetchSkins()
    alert('Skin berhasil dihapus')
  }

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url)
    alert('URL berhasil dicopy!')
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Skin Manager 19JT</h1>
      </div>

      <div className="upload-box">
        <h2>Upload Skin Baru</h2>
        <label htmlFor="fileInput" className="upload-area">
          {file? file.name : 'Klik untuk pilih file PNG'}
        </label>
        <input
          id="fileInput"
          type="file"
          accept=".png"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ display: 'none' }}
        />
        <button onClick={handleUpload} disabled={loading}>
          {loading? 'Uploading...' : 'Upload Skin'}
        </button>
      </div>

      <h2>Galeri Skin</h2>
      <div className="grid">
        {skins.map((skin) => (
          <div key={skin.id} className="skin-item">
            <img src={skin.url} alt={skin.name} className="skin-preview" />
            <p>{skin.name}</p>
            <button onClick={() => copyUrl(skin.url)}>Copy URL</button>
            <button className="delete-btn" onClick={() => handleDelete(skin.name)}>Hapus</button>
          </div>
        ))}
      </div>
    </div>
  )
}
