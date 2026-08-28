import React, { useEffect, useState } from 'react'
import { 
  Network, Activity, RefreshCw, AlertTriangle, Link2, 
  HelpCircle, Eye, EyeOff, ChevronDown, ChevronUp, ArrowRight, ArrowLeft 
} from 'lucide-react'
import api from '../api'

export default function MetricsDashboard({ 
  nodes = [], 
  edges = [], 
  simulationStatuses = {}, 
  onHighlightPath, 
  onClearHighlights 
}) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeCycleIndex, setActiveCycleIndex] = useState(null)
  
  // Search & Status filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, healthy, degraded, failed

  // Track expanded component row to show its connections
  const [expandedComponent, setExpandedComponent] = useState(null)

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/dashboard/metrics')
      setMetrics(response.data)
    } catch (err) {
      setError('Failed to fetch dashboard metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  // Highlight a dependency cycle directly on the graph canvas
  const handleHighlightCycle = (cycle, index) => {
    if (activeCycleIndex === index) {
      // Clear highlight if clicked again
      onClearHighlights()
      setActiveCycleIndex(null)
      return
    }

    const nodesSet = new Set(cycle)
    const edgesSet = new Set()
    
    // Construct edge IDs for the cycle: A -> B -> C -> A
    for (let i = 0; i < cycle.length; i++) {
      const source = cycle[i]
      const target = cycle[(i + 1) % cycle.length]
      edgesSet.add(`${source}-${target}`)
    }

    onHighlightPath(nodesSet, edgesSet)
    setActiveCycleIndex(index)
  }

  // Calculate blast radius percentage client-side dynamically using BFS
  const getBlastRadius = (nodeId) => {
    if (!nodes || nodes.length <= 1) return '0.0%'
    
    // Build adjacency list for downstream propagation (outgoing callers)
    // If A depends on B (A -> B), B failing propagates to A.
    // So to find B's downstream dependents, we trace B -> A (following incoming edges to B).
    const adj = {}
    nodes.forEach(n => { adj[n.id] = [] })
    
    edges.forEach(e => {
      if (adj[e.target]) {
        adj[e.target].push(e.source)
      }
    })
    
    const visited = new Set([nodeId])
    const queue = [nodeId]
    let count = 0
    
    while (queue.length > 0) {
      const curr = queue.shift()
      const dependents = adj[curr] || []
      dependents.forEach(dep => {
        if (!visited.has(dep)) {
          visited.add(dep)
          queue.push(dep)
          count++
        }
      })
    }
    
    const denominator = nodes.length - 1
    const percentage = (count / denominator) * 100
    return percentage.toFixed(1) + '%'
  }

  const toggleExpandComponent = (name) => {
    if (expandedComponent === name) {
      setExpandedComponent(null)
    } else {
      setExpandedComponent(name)
    }
  }

  if (loading && !metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-3">
        <div className="w-10 h-10 border-4 border-kps-gold border-t-kps-brown rounded-full animate-spin"></div>
        <span className="text-sm font-semibold text-gray-500">Calculating network metrics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center justify-between shadow-sm">
          <span>{error}</span>
          <button 
            onClick={fetchMetrics}
            className="flex items-center gap-1 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  // Filter components in table by name/type AND health status
  const filteredComponents = (metrics.top_connected_components || []).filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          comp.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const statusInfo = simulationStatuses[comp.name] || {}
    const status = statusInfo.status || 'healthy'
    const matchesStatus = statusFilter === 'all' || status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Metrics Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">KPS System Dashboard</h2>
          <p className="text-xs text-gray-500">Topology measurements and health scores of active components</p>
        </div>
        <button 
          onClick={fetchMetrics}
          className="flex items-center gap-1.5 bg-kps-brown hover:bg-kps-brown-light text-white px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Scrollable Dashboard Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-kps-brown/10 text-kps-brown rounded-lg">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Components</div>
              <div className="text-2xl font-extrabold text-gray-800">{metrics.total_components}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Edges</div>
              <div className="text-2xl font-extrabold text-gray-800">{metrics.total_dependencies}</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Graph Density</div>
              <div className="text-2xl font-extrabold text-gray-800">{metrics.graph_density}</div>
            </div>
          </div>

          <div className={`p-5 rounded-lg border shadow-sm flex items-center gap-4 ${
            metrics.detected_cycles.length > 0 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-white border-gray-200'
          }`}>
            <div className={`p-3 rounded-lg ${
              metrics.detected_cycles.length > 0 ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Circular Loops</div>
              <div className="text-2xl font-extrabold text-gray-800">{metrics.detected_cycles.length}</div>
            </div>
          </div>
        </div>

        {/* Dashboard Panels Grid */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Connected Components Table */}
          <div className="col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Centrality & Status Metrics</h3>
              
              {/* Search Filters Row */}
              <div className="flex items-center gap-2">
                {/* Status Dropdown Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="py-1.5 px-2.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-kps-gold bg-gray-50 text-gray-700 font-semibold"
                >
                  <option value="all">All Statuses</option>
                  <option value="healthy">🟢 Healthy</option>
                  <option value="degraded">🟡 Degraded</option>
                  <option value="failed">🔴 Failed</option>
                </select>

                {/* Text Search input */}
                <div className="relative w-48">
                  <input
                    type="text"
                    placeholder="Search service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-1.5 px-3 border border-gray-200 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-kps-gold bg-gray-50 text-gray-700"
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-500">
                    <th className="px-5 py-3 w-10"></th>
                    <th className="px-2 py-3">Component Name</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-center font-bold text-red-700">Blast Radius</th>
                    <th className="px-5 py-3 text-center">In-Degree</th>
                    <th className="px-5 py-3 text-center">Out-Degree</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredComponents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-gray-400 italic">
                        No services match your search or status filters.
                      </td>
                    </tr>
                  ) : (
                    filteredComponents.map((comp) => {
                      const statusInfo = simulationStatuses[comp.name] || {}
                      const status = statusInfo.status || 'healthy'
                      const blastRadius = getBlastRadius(comp.name)
                      const isExpanded = expandedComponent === comp.name
                      
                      let statusBadge = 'bg-green-50 text-green-700 border-green-200'
                      let dotColor = 'bg-green-500'
                      
                      if (status === 'failed') {
                        statusBadge = 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                        dotColor = 'bg-red-500'
                      } else if (status === 'degraded') {
                        statusBadge = 'bg-amber-50 text-amber-700 border-amber-200'
                        dotColor = 'bg-amber-500'
                      }

                      // Find connected edges
                      const directDependencies = edges.filter(e => e.source === comp.name)
                      const directDependents = edges.filter(e => e.target === comp.name)

                      return (
                        <React.Fragment key={comp.name}>
                          {/* Main Row */}
                          <tr 
                            onClick={() => toggleExpandComponent(comp.name)}
                            className={`cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                              isExpanded ? 'border-kps-gold bg-gray-50/50' : 'border-transparent'
                            }`}
                          >
                            <td className="px-5 py-3.5 text-center text-gray-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </td>
                            <td className="px-2 py-3.5 font-semibold text-gray-800">{comp.name}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600 uppercase border border-gray-200">
                                {comp.type}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${statusBadge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                {status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center font-extrabold text-red-700 bg-red-50/10">
                              {blastRadius}
                            </td>
                            <td className="px-5 py-3.5 text-center font-bold text-indigo-600">{comp.in_degree}</td>
                            <td className="px-5 py-3.5 text-center font-bold text-emerald-600">{comp.out_degree}</td>
                          </tr>

                          {/* Expanded Detail Row showing connected dependencies */}
                          {isExpanded && (
                            <tr className="bg-gray-50/70 border-b border-gray-100">
                              <td></td>
                              <td colSpan={6} className="px-4 py-4">
                                <div className="grid grid-cols-2 gap-6 text-xs bg-white p-4 rounded-lg border border-gray-200 shadow-inner">
                                  
                                  {/* Left sub-column: Outgoing Dependencies */}
                                  <div>
                                    <h4 className="font-bold text-gray-700 mb-2.5 flex items-center gap-1.5 pb-1 border-b border-gray-100">
                                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Direct Dependencies (Calls Out to: {directDependencies.length})</span>
                                    </h4>
                                    {directDependencies.length === 0 ? (
                                      <div className="text-gray-400 italic text-[11px] py-1">No outgoing dependencies</div>
                                    ) : (
                                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                        {directDependencies.map(dep => (
                                          <div 
                                            key={dep.target}
                                            className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-100"
                                          >
                                            <span className="font-semibold text-gray-800">{dep.target}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[9px] px-1.5 bg-gray-200 text-gray-500 font-bold uppercase rounded">
                                                {dep.type}
                                              </span>
                                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                dep.criticality === 'high' ? 'bg-red-100 text-red-700' :
                                                dep.criticality === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                                              }`}>
                                                {dep.criticality}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Right sub-column: Incoming Dependents */}
                                  <div>
                                    <h4 className="font-bold text-gray-700 mb-2.5 flex items-center gap-1.5 pb-1 border-b border-gray-100">
                                      <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Direct Dependents (Called By: {directDependents.length})</span>
                                    </h4>
                                    {directDependents.length === 0 ? (
                                      <div className="text-gray-400 italic text-[11px] py-1">No incoming dependents</div>
                                    ) : (
                                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                                        {directDependents.map(dep => (
                                          <div 
                                            key={dep.source}
                                            className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-100"
                                          >
                                            <span className="font-semibold text-gray-800">{dep.source}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-[9px] px-1.5 bg-gray-200 text-gray-500 font-bold uppercase rounded">
                                                {dep.type}
                                              </span>
                                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                                dep.criticality === 'high' ? 'bg-red-100 text-red-700' :
                                                dep.criticality === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                                              }`}>
                                                {dep.criticality}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column 3: Loops & Isolated nodes lists */}
          <div className="space-y-6">
            
            {/* Dependency Cycles List */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col max-h-[300px]">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Circular Loops ({metrics.detected_cycles.length})</h3>
              {metrics.detected_cycles.length === 0 ? (
                <div className="text-xs text-gray-400 italic py-4 text-center">
                  Perfect! No circular dependency loops detected.
                </div>
              ) : (
                <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                  {metrics.detected_cycles.map((cycle, idx) => (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-md border flex items-center justify-between text-xs transition-all ${
                        activeCycleIndex === idx 
                          ? 'bg-red-50 border-red-300 ring-1 ring-red-200' 
                          : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-red-700">Loop #{idx + 1}</div>
                        <div className="text-[10px] text-gray-500 truncate mt-0.5">
                          {cycle.join(' → ')} → {cycle[0]}
                        </div>
                      </div>
                      <button
                        onClick={() => handleHighlightCycle(cycle, idx)}
                        className={`p-1.5 rounded transition-colors ${
                          activeCycleIndex === idx 
                            ? 'bg-red-200 text-red-800 hover:bg-red-300' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={activeCycleIndex === idx ? "Clear Highlight" : "Highlight Cycle on Canvas"}
                      >
                        {activeCycleIndex === idx ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Isolated Components List */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col max-h-[220px]">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Isolated Nodes ({metrics.isolated_components.length})</h3>
              {metrics.isolated_components.length === 0 ? (
                <div className="text-xs text-gray-400 italic py-4 text-center">
                  No isolated components.
                </div>
              ) : (
                <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
                  {metrics.isolated_components.map((name) => (
                    <div 
                      key={name}
                      className="p-2 bg-gray-50 border border-gray-100 rounded-md text-xs font-semibold text-gray-700 flex items-center justify-between"
                    >
                      <span>{name}</span>
                      <span className="text-[9px] bg-gray-200 text-gray-500 font-bold px-1.5 py-0.5 rounded">
                        Standalone
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  )
}
