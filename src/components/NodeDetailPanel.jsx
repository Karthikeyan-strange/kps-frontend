import React, { useEffect, useState } from 'react'
import { 
  X, Server, Database, Monitor, Cloud, HelpCircle, 
  ArrowRight, ShieldAlert, ZapOff, Network, GitCommit 
} from 'lucide-react'
import api from '../api'

const TYPE_ICONS = {
  service: Server,
  database: Database,
  application: Monitor,
  external_system: Cloud,
  unknown: HelpCircle
}

export default function NodeDetailPanel({ 
  nodeId, 
  onClose, 
  onSimulateFailure,
  onAnalyzeChange,
  onHighlightLineage,
  onClearHighlights,
  onSelectComponent 
}) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!nodeId) return

    const fetchDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.get(`/components/${nodeId}`)
        setDetails(response.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to fetch component details')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [nodeId])

  if (!nodeId) return null

  const Icon = details ? (TYPE_ICONS[details.type] || HelpCircle) : HelpCircle

  return (
    <div className="w-96 bg-white border-l border-gray-200 h-full flex flex-col shadow-2xl relative z-10">
      {/* Detail Panel Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-kps-brown text-white">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-kps-gold" />
          <span className="font-bold text-sm uppercase tracking-wider">Component Detail</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-md hover:bg-kps-brown-light text-gray-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Detail Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-2">
            <div className="w-8 h-8 border-4 border-kps-gold border-t-kps-brown rounded-full animate-spin"></div>
            <span className="text-xs text-gray-500 font-semibold">Loading details...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs">
            {error}
          </div>
        ) : details ? (
          <>
            {/* Title & Metadata Card */}
            <div>
              <h2 className="text-lg font-bold text-gray-800">{details.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                  {details.type}
                </span>
                {details.is_placeholder && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Placeholder
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed">
                {details.description || 'No description provided.'}
              </p>
            </div>

            {/* Info Table */}
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ownership</h3>
              <div className="grid grid-cols-3 text-xs gap-y-2.5 py-1">
                <div className="text-gray-400 font-medium">Owner Team:</div>
                <div className="col-span-2 text-gray-800 font-semibold">{details.owner || 'Unknown'}</div>
                
                {details.metadata && Object.entries(details.metadata).map(([key, val]) => {
                  if (key.startsWith('_')) return null // omit internal keys
                  return (
                    <React.Fragment key={key}>
                      <div className="text-gray-400 font-medium capitalize">{key}:</div>
                      <div className="col-span-2 text-gray-800 font-semibold truncate" title={String(val)}>{String(val)}</div>
                    </React.Fragment>
                  )
                })}
              </div>
            </div>

            {/* Interactive Actions Grid */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Analysis Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAnalyzeChange(details.name)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-kps-brown text-kps-brown rounded-md hover:bg-gray-50 text-xs font-bold transition-all shadow-sm"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-kps-gold-dark" />
                  Impact Area
                </button>
                <button
                  onClick={() => onSimulateFailure(details.name)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 border border-red-200 text-red-700 rounded-md hover:bg-red-100 text-xs font-bold transition-all"
                >
                  <ZapOff className="w-3.5 h-3.5" />
                  Sim Failure
                </button>
              </div>

              {/* Lineage Tracer Buttons */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Graph Lineage Tracer</div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onHighlightLineage(details.name, 'upstream')}
                    className="flex-1 py-1.5 px-2 bg-kps-brown text-white text-[10px] font-bold rounded hover:bg-kps-brown-light transition-colors text-center"
                  >
                    Upstream
                  </button>
                  <button
                    onClick={() => onHighlightLineage(details.name, 'downstream')}
                    className="flex-1 py-1.5 px-2 bg-kps-brown text-white text-[10px] font-bold rounded hover:bg-kps-brown-light transition-colors text-center"
                  >
                    Downstream
                  </button>
                  <button
                    onClick={() => onHighlightLineage(details.name, 'both')}
                    className="flex-1 py-1.5 px-2 bg-kps-brown text-white text-[10px] font-bold rounded hover:bg-kps-brown-light transition-colors text-center"
                  >
                    Trace Both
                  </button>
                </div>
                <button
                  onClick={onClearHighlights}
                  className="w-full py-1 text-center text-[9px] text-gray-500 hover:text-kps-brown font-semibold transition-colors"
                >
                  Clear Lineage Highlights
                </button>
              </div>
            </div>

            {/* Direct Dependencies (Outgoing connections) */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                <span>Dependencies ({details.dependencies.length})</span>
                <span className="text-[9px] text-gray-400">Outbox (Calls)</span>
              </h3>
              {details.dependencies.length === 0 ? (
                <div className="text-xs text-gray-400 italic">None</div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {details.dependencies.map(dep => (
                    <button
                      key={dep.target}
                      onClick={() => onSelectComponent(dep.target)}
                      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all text-left group"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-700 truncate group-hover:text-kps-brown">{dep.target}</div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider">{dep.type}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          dep.criticality === 'high' ? 'bg-red-50 text-red-600' :
                          dep.criticality === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {dep.criticality}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Dependents (Incoming connections) */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                <span>Dependents ({details.dependents.length})</span>
                <span className="text-[9px] text-gray-400">Inbox (Called By)</span>
              </h3>
              {details.dependents.length === 0 ? (
                <div className="text-xs text-gray-400 italic">None</div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {details.dependents.map(dep => (
                    <button
                      key={dep.source}
                      onClick={() => onSelectComponent(dep.source)}
                      className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all text-left group"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-gray-700 truncate group-hover:text-kps-brown">{dep.source}</div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider">{dep.type}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          dep.criticality === 'high' ? 'bg-red-50 text-red-600' :
                          dep.criticality === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-600'
                        }`}>
                          {dep.criticality}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-xs text-gray-400 py-12">
            No component selected.
          </div>
        )}
      </div>
    </div>
  )
}
