import React from 'react'
import { Handle, Position } from 'reactflow'
import { Server, Monitor, Database, Cloud, HelpCircle } from 'lucide-react'

const BaseNode = ({ icon: Icon, title, data, borderColor, headerBg }) => {
  const status = data.status || 'healthy'
  const isPlaceholder = data.is_placeholder || false
  
  // Status styling
  let statusColor = 'text-green-700 bg-green-50 border-green-200'
  let dotColor = 'bg-green-600'
  let cardBorder = borderColor
  
  if (status === 'failed') {
    statusColor = 'text-red-700 bg-red-50 border-red-200 animate-pulse'
    dotColor = 'bg-red-600'
    cardBorder = 'border-red-600 ring-2 ring-red-200'
  } else if (status === 'degraded') {
    statusColor = 'text-amber-700 bg-amber-50 border-amber-200'
    dotColor = 'bg-amber-600'
    cardBorder = 'border-amber-600 ring-2 ring-amber-200'
  }

  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[210px] transition-all duration-200 ${cardBorder}`}>
      {/* Handles for connector lines */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2.5 h-2.5 !bg-kps-brown border-2 border-white rounded-full" 
        style={{ left: '-6px' }}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        className="w-2.5 h-2.5 !bg-kps-brown border-2 border-white rounded-full" 
        style={{ right: '-6px' }}
      />
      
      {/* Node Header */}
      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
        <div className={`p-1.5 rounded-md ${headerBg} text-white`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{title}</div>
          <div className="text-sm font-bold text-gray-800 truncate" title={data.name}>{data.name}</div>
        </div>
      </div>
      
      {/* Node Footer details */}
      <div className="flex items-center justify-between mt-1">
        {isPlaceholder ? (
          <span className="text-[9px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded border border-gray-200">
            Placeholder
          </span>
        ) : (
          <span className="text-[10px] text-gray-400 truncate max-w-[100px]" title={data.owner}>
            Owner: {data.owner || 'N/A'}
          </span>
        )}
        
        {/* Status Badge */}
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${statusColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
          {status}
        </div>
      </div>
    </div>
  )
}

export const ServiceNode = ({ data }) => (
  <BaseNode icon={Server} title="Service/API" data={data} borderColor="border-kps-gold" headerBg="bg-kps-brown" />
)

export const DatabaseNode = ({ data }) => (
  <BaseNode icon={Database} title="Database" data={data} borderColor="border-emerald-600" headerBg="bg-emerald-600" />
)

export const AppNode = ({ data }) => (
  <BaseNode icon={Monitor} title="Application" data={data} borderColor="border-indigo-600" headerBg="bg-indigo-600" />
)

export const ExternalNode = ({ data }) => (
  <BaseNode icon={Cloud} title="External System" data={data} borderColor="border-amber-600" headerBg="bg-amber-600" />
)

export const UnknownNode = ({ data }) => (
  <BaseNode icon={HelpCircle} title="Unknown Node" data={data} borderColor="border-gray-400 border-dashed" headerBg="bg-gray-400" />
)
