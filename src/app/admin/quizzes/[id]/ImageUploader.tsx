'use client'

import { useRef, useState } from 'react'

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string | null
  onChange: (url: string | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Upload failed')
      setUploading(false)
      return
    }

    onChange(json.url)
    setUploading(false)
  }

  function removeImage() {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-start gap-3">
          <img
            src={value}
            alt="Preview"
            className="max-h-40 rounded border"
          />
          <button
            type="button"
            onClick={removeImage}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Remove
          </button>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={handleFile}
          disabled={uploading}
          className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gpa-green file:text-white file:cursor-pointer hover:file:opacity-90"
        />
      )}

      {uploading && (
        <p className="text-sm text-gray-600">Uploading...</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
