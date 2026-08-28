import React, { useState, useRef } from 'react'
import { UploadCloud, AlertCircle, CheckCircle2, FileCode, RefreshCw } from 'lucide-react'
import api from '../api'

export default function YamlUpload({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [responseMsg, setResponseMsg] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (validateFileExtension(file)) {
        setSelectedFile(file)
        triggerUpload(file)
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (validateFileExtension(file)) {
        setSelectedFile(file)
        triggerUpload(file)
      }
    }
  }

  const validateFileExtension = (file) => {
    const filename = file.name.toLowerCase()
    if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
      setErrorMsg(null)
      return true
    }
    setErrorMsg('Invalid file format. Only YAML (.yaml or .yml) configuration files are supported.')
    setSelectedFile(null)
    return false
  }

  const triggerUpload = async (file) => {
    setLoading(true)
    setErrorMsg(null)
    setResponseMsg(null)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/dependencies/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setResponseMsg(response.data.message)
      setSelectedFile(null)
      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (err) {
      const serverErr = err.response?.data?.detail || 'An error occurred during file upload.'
      setErrorMsg(serverErr)
    } finally {
      setLoading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const handleReloadAll = async () => {
    setLoading(true)
    setErrorMsg(null)
    setResponseMsg(null)
    try {
      const response = await api.post('/dependencies/reload')
      setResponseMsg(`Reload complete: Successfully mapped ${response.data.loaded_components_count} components.`)
      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (err) {
      setErrorMsg('Failed to trigger database reload.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Upload Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">YAML Configuration Center</h2>
          <p className="text-xs text-gray-500">Upload new components or load unified microservices topologies</p>
        </div>
        <button
          onClick={handleReloadAll}
          disabled={loading}
          className="flex items-center gap-1.5 border border-kps-brown text-kps-brown hover:bg-gray-50 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload Directory
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl mx-auto w-full">
        {/* Alerts Center */}
        {responseMsg && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <div className="font-bold">Upload Successful</div>
              <div>{responseMsg}</div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <div className="font-bold">Configuration Error</div>
              <div className="font-mono mt-1 text-[10px] bg-red-100/50 p-2.5 rounded border border-red-200/50 overflow-x-auto whitespace-pre-wrap leading-normal">
                {errorMsg}
              </div>
            </div>
          </div>
        )}

        {/* Drag-and-Drop Drag Box */}
        <form 
          onDragEnter={handleDrag} 
          onDragOver={handleDrag} 
          onDragLeave={handleDrag} 
          onDrop={handleDrop}
          onSubmit={(e) => e.preventDefault()}
          className={`border-3 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all bg-white shadow-sm ${
            dragActive 
              ? 'border-kps-gold bg-kps-gold/5 scale-[0.99]' 
              : 'border-gray-200 hover:border-kps-gold/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".yaml,.yml"
            className="hidden"
          />

          <div className="p-4 bg-kps-brown/5 rounded-full text-kps-brown mb-4">
            {loading ? (
              <RefreshCw className="w-8 h-8 animate-spin text-kps-gold" />
            ) : (
              <UploadCloud className="w-8 h-8 text-kps-brown" />
            )}
          </div>

          <h3 className="text-sm font-bold text-gray-700">Drag & Drop Dependency YAML</h3>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">
            Drag your file here or click below to browse. Supports single service definitions or combined array files.
          </p>

          <button
            type="button"
            onClick={handleButtonClick}
            disabled={loading}
            className="mt-5 py-2 px-4 bg-kps-brown hover:bg-kps-brown-light text-white text-xs font-bold rounded-md transition-all shadow-sm disabled:opacity-50"
          >
            Select Configuration File
          </button>
        </form>

        {/* Template Guide card */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
            <FileCode className="w-4 h-4 text-kps-gold-dark" />
            <span>Supported Dataset Schema Reference</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            You can upload a combined list of multiple services structured as a YAML array:
          </p>
          <pre className="text-[10px] font-mono bg-gray-50 p-3.5 border border-gray-100 rounded-md text-gray-600 overflow-x-auto whitespace-pre leading-relaxed">
{`- service: Customer Service
  type: API
  dependencies:
    - Auth Service
    - Customer DB
  consumers:
    - Customer Portal

- service: Customer DB
  type: database
  dependencies: []`}
          </pre>
        </div>

      </div>
    </div>
  )
}
