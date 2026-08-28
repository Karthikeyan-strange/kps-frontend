import React, { useMemo, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState
} from 'reactflow'

import {
  ServiceNode,
  DatabaseNode,
  AppNode,
  ExternalNode,
  UnknownNode
} from './CustomNodes'

// Map node types to React Flow custom components
const NODE_TYPES = {
  service: ServiceNode,
  database: DatabaseNode,
  application: AppNode,
  external_system: ExternalNode,
  unknown: UnknownNode
}

// Spacing constants for column-based auto-layout
const COLUMN_X = {
  application: 50,
  service: 380,
  database: 710,
  external_system: 710,
  unknown: 380
}

const VERTICAL_SPACING = 150

export default function DependencyGraph({
  nodesData,
  edgesData,
  highlightedNodes = null, // Set of node IDs
  highlightedEdges = null, // Set of edge IDs
  simulationStatuses = {}, // node_name -> { status: 'healthy'|'degraded'|'failed' }
  onNodeClick = null
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Layout algorithm: Position nodes into clean structured columns based on component type
  const layoutNodes = (rawNodes, statuses) => {
    // Group nodes by their column types
    const columns = {
      application: [],
      service: [],
      database: [], // databases and external systems share the right column
      unknown: []
    }

    rawNodes.forEach(node => {
      let category = node.type
      if (category === 'external_system') category = 'database'
      if (!columns[category]) {
        category = 'unknown'
      }
      columns[category].push(node)
    })

    // Compute coordinate layout
    const positionedNodes = []
    
    // Find the maximum height column to center shorter columns vertically
    const heights = Object.keys(columns).map(k => columns[k].length)
    const maxHeight = Math.max(...heights) * VERTICAL_SPACING

    Object.entries(columns).forEach(([columnType, list]) => {
      const colHeight = list.length * VERTICAL_SPACING
      const yOffset = (maxHeight - colHeight) / 2 // vertical centering offset

      list.forEach((node, index) => {
        // Determine column X coordinate
        let x = COLUMN_X[node.type] || COLUMN_X.unknown
        let y = yOffset + index * VERTICAL_SPACING

        // Read dynamic status (from failure simulation)
        const simData = statuses[node.id] || {}
        const status = simData.status || 'healthy'

        // Determine if node is dim (when a highlighted path is active)
        const isDim = highlightedNodes && !highlightedNodes.has(node.id)

        positionedNodes.push({
          id: node.id,
          type: node.type,
          position: { x, y },
          data: {
            name: node.name,
            owner: node.owner,
            is_placeholder: node.is_placeholder,
            description: node.description,
            metadata: node.metadata,
            status: status
          },
          style: {
            opacity: isDim ? 0.18 : 1,
            transition: 'opacity 0.3s ease'
          }
        })
      })
    })

    return positionedNodes
  }

  // Edge formatter: Style edges by criticality and highlights
  const formatEdges = (rawEdges, highlightedN, highlightedE) => {
    return rawEdges.map(edge => {
      const isHigh = edge.criticality === 'high'
      const isMedium = edge.criticality === 'medium'
      
      // Determine stroke styling based on criticality
      let strokeColor = '#94a3b8' // gray default (low criticality)
      let strokeWidth = 1.5
      let strokeDasharray = '2,2' // dotted default

      if (isHigh) {
        strokeColor = '#b91c1c' // bold red/brown
        strokeWidth = 2.5
        strokeDasharray = undefined // solid
      } else if (isMedium) {
        strokeColor = '#d97706' // orange
        strokeWidth = 2.0
        strokeDasharray = '6,6' // dashed
      }

      // If a specific set of edges is highlighted, dim the others
      const edgeId = `${edge.source}-${edge.target}`
      const isHighlighted = highlightedE ? highlightedE.has(edgeId) : false
      const isDim = highlightedE && !isHighlighted

      return {
        id: edgeId,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: isHigh && !isDim, // animate critical flows
        style: {
          stroke: isHighlighted ? '#eab308' : strokeColor, // highlight gold
          strokeWidth: isHighlighted ? 3.5 : strokeWidth,
          strokeDasharray: strokeDasharray,
          opacity: isDim ? 0.1 : 1,
          transition: 'opacity 0.3s, stroke 0.3s'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighlighted ? '#eab308' : strokeColor,
          width: 20,
          height: 20
        }
      }
    })
  }

  // Update layout when nodesData changes
  useEffect(() => {
    if (nodesData.length > 0) {
      const positioned = layoutNodes(nodesData, simulationStatuses)
      setNodes(positioned)
    } else {
      setNodes([])
    }
  }, [nodesData, simulationStatuses, highlightedNodes])

  // Update edges layout when edgesData or highlights change
  useEffect(() => {
    if (edgesData.length > 0) {
      const formatted = formatEdges(edgesData, highlightedNodes, highlightedEdges)
      setEdges(formatted)
    } else {
      setEdges([])
    }
  }, [edgesData, highlightedNodes, highlightedEdges])

  const handleNodeClick = (event, node) => {
    if (onNodeClick) {
      onNodeClick(node.id)
    }
  }

  return (
    <div className="w-full h-full bg-gray-50 relative flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        attributionPosition="bottom-left"
      >
        <Background color="#cbd5e1" gap={16} size={1} />
        <Controls showInteractive={false} className="bg-white" />
        <MiniMap 
          nodeColor={(node) => {
            if (node.data.status === 'failed') return '#ef4444'
            if (node.data.status === 'degraded') return '#f59e0b'
            return '#FFC72C'
          }}
          maskColor="rgba(241, 245, 249, 0.7)"
          style={{ height: 110, width: 150 }}
        />
      </ReactFlow>
    </div>
  )
}
