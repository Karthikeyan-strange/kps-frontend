import React, { useState, useEffect } from 'react'
import { 
  Network, BarChart3, ZapOff, UploadCloud, Info, AlertTriangle, 
  Trash2, ShieldAlert, CheckCircle, HelpCircle, Layers 
} from 'lucide-react'
import api from './api'

import DependencyGraph from './components/DependencyGraph'
import NodeDetailPanel from './components/NodeDetailPanel'
import MetricsDashboard from './components/MetricsDashboard'
import FailureSimulator from './components/FailureSimulator'
import YamlUpload from './components/YamlUpload'

export default function App() {
  const [activeTab, setActiveTab] = useState('graph') // graph, metrics, simulator, upload
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Selection & Highlight states
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [highlightedNodes, setHighlightedNodes] = useState(null)
  const [highlightedEdges, setHighlightedEdges] = useState(null)
  const [activeAnalysis, setActiveAnalysis] = useState(null) // { type: 'impact'|'lineage', target, info }

  // Simulation state
  const [simulationStatuses, setSimulationStatuses] = useState({})

  // Fetch graph data from backend
  const fetchGraphData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/graph')
      setNodes(response.data.nodes)
      setEdges(response.data.edges)
    } catch (err) {
      setError('Failed to connect to KPS backend server. Make sure the backend is running at http://127.0.0.1:8000')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGraphData()
  }, [])

  // Lineage highlight drawer trigger
  const handleHighlightLineage = async (name, direction) => {
    try {
      const response = await api.get(`/components/${name}/lineage`, {
        params: { direction, depth: 20 }
      })
      
      const lineageData = response.data.lineage
      const nodesSet = new Set([name])
      const edgesSet = new Set()

      lineageData.forEach(item => {
        nodesSet.add(item.component_name)
        
        // Add path edges. Path looks like: ['api-gateway', 'auth-service']
        const path = item.propagation_path
        for (let i = 0; i < path.length - 1; i++) {
          edgesSet.add(`${path[i]}-${path[i+1]}`)
          edgesSet.add(`${path[i+1]}-${path[i]}`) // fallback bidirectional edge ID
        }
      })

      setHighlightedNodes(nodesSet)
      setHighlightedEdges(edgesSet)
      setActiveAnalysis({
        type: 'lineage',
        target: name,
        info: `${direction.toUpperCase()} lineage trace: ${lineageData.length} paths discovered.`
      })
    } catch (err) {
      alert('Error fetching lineage: ' + (err.response?.data?.detail || err.message))
    }
  }

  // Change Impact trigger
  const handleAnalyzeChange = async (name) => {
    try {
      const response = await api.post('/analyze/change-impact', {
        component_name: name,
        change_type: 'downtime'
      })
      
      const impactData = response.data
      const nodesSet = new Set([name])
      const edgesSet = new Set()

      impactData.highlighted_nodes = [name]
      impactData.impacted_components.forEach(item => {
        nodesSet.add(item.component_name)
        const path = item.propagation_path // e.g. ['stripe-api', 'payment-service', 'api-gateway']
        // The propagation path goes from target out. In impact analysis, edges are dependencies, i.e. caller -> provider.
        // The path lists them. Let's add them as edge IDs.
        for (let i = 0; i < path.length - 1; i++) {
          // Since propagation path traces from failed seed to callers,
          // the caller depends on provider, so the edge goes: caller -> provider (path[i+1] -> path[i])
          // Let's add both orientations to be absolutely safe with edge lookup
          edgesSet.add(`${path[i]}-${path[i+1]}`)
          edgesSet.add(`${path[i+1]}-${path[i]}`)
        }
      })

      setHighlightedNodes(nodesSet)
      setHighlightedEdges(edgesSet)
      setActiveAnalysis({
        type: 'impact',
        target: name,
        info: `Blast Radius: ${impactData.blast_radius_percentage}% (${impactData.impacted_count} components affected)`
      })
    } catch (err) {
      alert('Error running impact analysis: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleRunSimulation = (statuses) => {
    setSimulationStatuses(statuses)
    // Automatically switch to graph tab to let them see it
    setActiveTab('graph')
    // Clear other highlights
    handleClearHighlights()
  }

  const handleResetSimulation = () => {
    setSimulationStatuses({})
  }

  const handleClearHighlights = () => {
    setHighlightedNodes(null)
    setHighlightedEdges(null)
    setActiveAnalysis(null)
  }

  const handleUploadSuccess = () => {
    fetchGraphData() // reload nodes and edges
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-gray-50">
      
      {/* 1. Navbar - KPS Branded Header (UPS Brown & Gold) */}
      <header className="h-14 bg-kps-brown border-b-4 border-kps-gold flex items-center justify-between px-6 text-white shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          {/* Custom SVG UPS style Shield Logo for KPS */}
          <svg className="w-8 h-8 text-kps-gold fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-12h4c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-4v4h-2V8zm2 4h2v-2h-2v2z" className="hidden" />
            <path d="M12 2.1C8.2 2.7 5.1 5.3 3.6 8.9c1.6.8 3.4 1.2 5.4 1.2h6c2 0 3.8-.4 5.4-1.2C18.9 5.3 15.8 2.7 12 2.1zM2 10.3c.7 4.9 3.9 9.1 8.3 11 1.1-2.4 2.8-4.5 4.9-6.1.4-.3.8-.6 1.2-.8.6-.3 1.3-.6 2-.8 1.4-.4 2.8-.5 4.3-.4-.3-1-.8-2-1.4-2.9-1.6.8-3.4 1.2-5.4 1.2H8.3c-2 0-3.8-.4-5.4-1.2-.3.3-.6.6-.9 1z" className="hidden" />
            {/* Elegant shield vector */}
            <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 3c2 0 3.5 1.5 3.5 3.5S14 12 12 12s-3.5-1.5-3.5-3.5S10 5 12 5zm-3 11h6c.55 0 1 .45 1 1v1c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-1c0-.55.45-1 1-1z" />
          </svg>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-wide text-kps-gold flex items-center gap-1.5">
              KPS <span className="text-white text-xs font-semibold px-2 py-0.2 bg-white/10 rounded uppercase">Visualizer</span>
            </span>
            <span className="text-[10px] text-gray-300 font-bold -mt-1">API Dependency & Cascade Impact Analyzer</span>
          </div>
        </div>

        {/* Server status indicator */}
        <div className="flex items-center gap-2">
          {error ? (
            <div className="flex items-center gap-1.5 bg-red-950 text-red-400 px-3 py-1 rounded-full border border-red-800 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              SERVER OFFLINE
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-green-950 text-green-400 px-3 py-1 rounded-full border border-green-800 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              TOPOLOGY SYNCED ({nodes.length} Component Nodes)
            </div>
          )}
        </div>
      </header>

      {/* 2. Workspace Body (Left Tabs sidebar + Canvas/Content + Right details) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Tab bar (Branded) */}
        <nav className="w-64 bg-kps-brown-dark text-gray-300 flex flex-col justify-between shrink-0 shadow-lg border-r border-black/10">
          <div className="py-4 space-y-1">
            <div className="px-5 mb-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Main Workspace</div>
            
            <button
              onClick={() => setActiveTab('graph')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all border-l-4 text-left ${
                activeTab === 'graph'
                  ? 'border-kps-gold text-kps-gold bg-white/5 font-extrabold'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Network className="w-4 h-4" />
              Graph Visualizer
            </button>

            <button
              onClick={() => setActiveTab('metrics')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all border-l-4 text-left ${
                activeTab === 'metrics'
                  ? 'border-kps-gold text-kps-gold bg-white/5 font-extrabold'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Metrics Dashboard
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all border-l-4 text-left ${
                activeTab === 'simulator'
                  ? 'border-kps-gold text-kps-gold bg-white/5 font-extrabold'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <ZapOff className="w-4 h-4" />
              Failure Simulator
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all border-l-4 text-left ${
                activeTab === 'upload'
                  ? 'border-kps-gold text-kps-gold bg-white/5 font-extrabold'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              YAML Config Upload
            </button>
          </div>

          {/* Sidebar Footer info */}
          <div className="p-4 border-t border-white/[0.05] bg-black/20 text-[10px] text-gray-500 space-y-1.5">
            <div><b>Environment:</b> Production Sandbox</div>
            <div><b>Theme:</b> KPS Corporate Brown</div>
          </div>
        </nav>

        {/* Center Panel Container */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* Analysis Active Header Banner */}
          {activeAnalysis && (
            <div className="absolute top-4 left-4 max-w-xl w-full bg-white/95 backdrop-blur-sm border-2 border-kps-gold rounded-lg px-4 py-3 shadow-lg z-20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-kps-gold/20 text-kps-brown rounded">
                  {activeAnalysis.type === 'impact' ? (
                    <ShieldAlert className="w-5 h-5 text-kps-brown" />
                  ) : (
                    <Layers className="w-5 h-5 text-kps-brown" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-kps-brown uppercase tracking-wider">
                    {activeAnalysis.type === 'impact' ? 'Change Impact Analysis' : 'Lineage Path Highlighted'}
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Target: <b>{activeAnalysis.target}</b> — {activeAnalysis.info}
                  </div>
                </div>
              </div>
              <button
                onClick={handleClearHighlights}
                className="flex items-center gap-1 bg-kps-brown hover:bg-kps-brown-light text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Overlay
              </button>
            </div>
          )}

          {activeTab === 'graph' && (
            <div className="w-full h-full flex flex-col">
              {error ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="max-w-md p-6 bg-red-50 border border-red-200 rounded-lg text-center space-y-3">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                    <h3 className="text-sm font-bold text-red-800">Connection Error</h3>
                    <p className="text-xs text-red-600 leading-relaxed">{error}</p>
                    <button 
                      onClick={fetchGraphData}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md shadow-sm transition-colors"
                    >
                      Retry Connection
                    </button>
                  </div>
                </div>
              ) : (
                <DependencyGraph 
                  nodesData={nodes}
                  edgesData={edges}
                  highlightedNodes={highlightedNodes}
                  highlightedEdges={highlightedEdges}
                  simulationStatuses={simulationStatuses}
                  onNodeClick={setSelectedNodeId}
                />
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <MetricsDashboard 
              nodes={nodes}
              edges={edges}
              simulationStatuses={simulationStatuses}
              onHighlightPath={(nodesSet, edgesSet) => {
                setHighlightedNodes(nodesSet)
                setHighlightedEdges(edgesSet)
                setActiveAnalysis({
                  type: 'lineage',
                  target: 'Dependency Loop',
                  info: 'Highlighting cycle nodes and connector channels.'
                })
                setActiveTab('graph')
              }}
              onClearHighlights={handleClearHighlights}
            />
          )}

          {activeTab === 'simulator' && (
            <FailureSimulator 
              components={nodes}
              onRunSimulation={handleRunSimulation}
              onResetSimulation={handleResetSimulation}
            />
          )}

          {activeTab === 'upload' && (
            <YamlUpload onUploadSuccess={handleUploadSuccess} />
          )}

        </main>

        {/* Right context Drawer */}
        {selectedNodeId && activeTab === 'graph' && (
          <NodeDetailPanel 
            nodeId={selectedNodeId}
            onClose={() => setSelectedNodeId(null)}
            onSimulateFailure={(name) => {
              // Redirect to simulator tab and preselect node
              setActiveTab('simulator')
              // Note: simulator handles multiple seeds, they can click execute there
            }}
            onAnalyzeChange={handleAnalyzeChange}
            onHighlightLineage={handleHighlightLineage}
            onClearHighlights={handleClearHighlights}
            onSelectComponent={setSelectedNodeId}
          />
        )}

      </div>
    </div>
  )
}
