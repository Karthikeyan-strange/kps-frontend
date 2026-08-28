import React, { useState, useEffect } from 'react'
import { ZapOff, ShieldAlert, CheckCircle, Flame, RefreshCw } from 'lucide-react'
import api from '../api'

export default function FailureSimulator({ 
  components, 
  onRunSimulation, 
  onResetSimulation 
}) {
  const [selectedNodes, setSelectedNodes] = useState([])
  const [simulationResults, setSimulationResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Sync checkboxes if a node gets passed in from the Detail Panel
  useEffect(() => {
    // If details get reset or selected list changes externally
  }, [])

  const handleToggleNode = (name) => {
    if (selectedNodes.includes(name)) {
      setSelectedNodes(selectedNodes.filter(n => n !== name))
    } else {
      setSelectedNodes([...selectedNodes, name])
    }
  }

  const handleStartSimulation = async () => {
    if (selectedNodes.length === 0) return

    setLoading(true)
    setError(null)
    try {
      const response = await api.post('/analyze/failure-simulation', {
        failed_components: selectedNodes
      })
      
      setSimulationResults(response.data)
      
      // Map results back to the parent to render statuses on node boxes in graph
      const statusMap = {}
      response.data.simulation_results.forEach(res => {
        statusMap[res.component_name] = {
          status: res.status,
          reason: res.reason,
          root_causes: res.root_causes
        }
      })
      onRunSimulation(statusMap)
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to simulate failure cascade')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSelectedNodes([])
    setSimulationResults(null)
    setError(null)
    onResetSimulation()
  }

  const getStatusClasses = (status) => {
    switch (status) {
      case 'failed':
        return 'bg-red-50 text-red-800 border-red-200'
      case 'degraded':
        return 'bg-amber-50 text-amber-800 border-amber-200'
      default:
        return 'bg-green-50 text-green-800 border-green-200'
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Simulation Header */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <ZapOff className="w-5 h-5 text-red-600" />
          Cascading Failure Simulator
        </h2>
        <p className="text-xs text-gray-500">Inject outages into services and trace transitive degradation</p>
      </div>

      <div className="flex-1 overflow-hidden flex divide-x divide-gray-200">
        
        {/* Left Side: Outage Configuration Checkboxes */}
        <div className="w-1/3 flex flex-col bg-white overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Seed Outages</span>
            {selectedNodes.length > 0 && (
              <button 
                onClick={() => setSelectedNodes([])}
                className="text-[10px] text-red-600 font-bold hover:underline"
              >
                Clear Selection
              </button>
            )}
          </div>
          
          {/* Scrollable list of nodes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {components.length === 0 ? (
              <div className="text-xs text-gray-400 italic text-center py-8">
                No components loaded to simulate.
              </div>
            ) : (
              components.map(comp => (
                <label 
                  key={comp.id}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedNodes.includes(comp.id)
                      ? 'bg-red-50 border-red-300 shadow-sm'
                      : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedNodes.includes(comp.id)}
                    onChange={() => handleToggleNode(comp.id)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-800 truncate">{comp.name}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">{comp.type}</div>
                  </div>
                </label>
              ))
            )}
          </div>

          {/* Trigger Panel */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
            <button
              onClick={handleReset}
              disabled={selectedNodes.length === 0 && !simulationResults}
              className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              onClick={handleStartSimulation}
              disabled={selectedNodes.length === 0 || loading}
              className="flex-1 py-2 px-3 bg-red-600 text-white hover:bg-red-700 rounded-md text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Simulating...
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4" />
                  Run Outage
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Simulation Results Details */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          {error && (
            <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs leading-relaxed">
              {error}
            </div>
          )}

          {!simulationResults ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <ZapOff className="w-12 h-12 text-gray-300 mb-2.5" />
              <h3 className="text-sm font-bold text-gray-600">No Simulation Active</h3>
              <p className="text-xs max-w-xs leading-relaxed mt-1 text-gray-400">
                Check one or more services in the list on the left and click <b>Run Outage</b> to simulate cascading network breakdowns.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Counters Summary */}
              <div className="p-6 bg-white border-b border-gray-200 grid grid-cols-3 gap-4">
                <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-center">
                  <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Failed Nodes</div>
                  <div className="text-2xl font-extrabold text-red-700 mt-1">{simulationResults.failed_count}</div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg text-center">
                  <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Degraded Nodes</div>
                  <div className="text-2xl font-extrabold text-amber-700 mt-1">{simulationResults.degraded_count}</div>
                </div>

                <div className="bg-green-50 border border-green-100 p-4 rounded-lg text-center">
                  <div className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Healthy Nodes</div>
                  <div className="text-2xl font-extrabold text-green-700 mt-1">{simulationResults.healthy_count}</div>
                </div>
              </div>

              {/* Status List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cascade Simulation Results Log</h3>
                
                {simulationResults.simulation_results.map(res => {
                  const status = res.status
                  const isHealthy = status === 'healthy'
                  const isFailed = status === 'failed'

                  return (
                    <div 
                      key={res.component_name}
                      className={`p-3 rounded-lg border flex flex-col bg-white text-xs ${getStatusClasses(status)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-800 text-sm">{res.component_name}</div>
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                          {isHealthy ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
                          )}
                          <span>{status}</span>
                        </div>
                      </div>

                      {/* Reason mapping */}
                      {!isHealthy && (
                        <div className="text-gray-600 mt-1.5 leading-relaxed bg-white/50 p-2 rounded border border-black/[0.03]">
                          <b>Impact:</b> {res.reason}
                        </div>
                      )}

                      {/* Root causes */}
                      {res.root_causes.length > 0 && (
                        <div className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                          <b>Root Cause Outages:</b> 
                          <span className="font-semibold text-gray-600">
                            {res.root_causes.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  )
}
