import React, { useState, useEffect } from 'react'
import { 
  Database, Calendar, Trash2, RefreshCw, AlertTriangle, 
  CheckCircle2, FolderOpen, Layers 
} from 'lucide-react'
import api from '../api'

export default function SavedDatasets({ onDatasetLoaded }) {
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  const fetchDatasets = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/history')
      setDatasets(response.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch saved datasets. Please ensure your backend has Supabase configured.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatasets()
  }, [])

  const handleLoadDataset = async (id, filename) => {
    const confirmLoad = window.confirm(`Are you sure you want to load "${filename}"? This will clean your current visualizer workspace.`)
    if (!confirmLoad) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const response = await api.post(`/history/load/${id}`)
      setSuccessMessage(response.data.message)
      if (onDatasetLoaded) {
        onDatasetLoaded()
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to load dataset: ${filename}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDataset = async (id, filename) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${filename}" from your saved datasets history?`)
    if (!confirmDelete) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await api.delete(`/history/${id}`)
      setSuccessMessage(`"${filename}" has been deleted from history.`)
      fetchDatasets() // refresh list
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to delete dataset: ${filename}`)
      setLoading(false)
    }
  }

  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    } catch (e) {
      return isoString
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Page Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Saved Datasets</h2>
          <p className="text-xs text-gray-500">Retrieve and load previously uploaded microservices topologies stored in Supabase</p>
        </div>
        <button 
          onClick={fetchDatasets}
          disabled={loading}
          className="flex items-center gap-1.5 bg-kps-brown hover:bg-kps-brown-light text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Database
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full space-y-6">
        
        {/* Status Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold">Error Encountered</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold">Success</div>
              <div>{successMessage}</div>
            </div>
          </div>
        )}

        {/* Datasets Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <Database className="w-4 h-4 text-kps-brown" />
            <h3 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Archived YAML Topology Files</h3>
          </div>

          {datasets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Database className="w-12 h-12 text-gray-300 mb-3" />
              <h4 className="text-sm font-bold text-gray-700">No saved datasets found</h4>
              <p className="text-xs text-gray-500 max-w-md mt-1 leading-relaxed">
                When you upload new YAML configuration files under the <b>Upload Config</b> page, they will automatically be archived in Supabase and listed here for quick retrieval.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-500">
                    <th className="px-5 py-3">File Name</th>
                    <th className="px-5 py-3 text-center">Components Count</th>
                    <th className="px-5 py-3">Saved Timestamp</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {datasets.map((dataset) => (
                    <tr key={dataset.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-800 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-kps-gold" />
                        <div>
                          <div>{dataset.filename}</div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{dataset.id}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="px-2 py-0.5 bg-kps-brown/10 text-kps-brown text-[10px] font-bold rounded-full">
                          {dataset.components_count} Nodes
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 flex items-center gap-1.5 mt-2.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatTimestamp(dataset.created_at)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleLoadDataset(dataset.id, dataset.filename)}
                            disabled={loading}
                            className="flex items-center gap-1 bg-kps-brown hover:bg-kps-brown-light text-white text-[10px] font-bold px-2.5 py-1.5 rounded transition-all shadow-sm"
                            title="Load this topology into the visualizer"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            Load Dataset
                          </button>
                          <button
                            onClick={() => handleDeleteDataset(dataset.id, dataset.filename)}
                            disabled={loading}
                            className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete this record from history"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
