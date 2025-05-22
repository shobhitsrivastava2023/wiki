import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { FileText, StickyNote } from 'lucide-react'

interface CustomNodeData {
  title: string
  content: string
  type: 'note' | 'article'
  onArticleClick?: () => void
}

export const CustomNode = memo(({ data, isConnectable }: NodeProps<CustomNodeData>) => {
  const isArticle = data.type === 'article'
  
  return (
    <div 
      className={`px-4 py-2 shadow-md rounded-md w-48 border-2 ${
        isArticle 
          ? 'bg-blue-50 border-blue-200 hover:border-blue-400' 
          : 'bg-amber-50 border-amber-200 hover:border-amber-400'
      } transition-colors`}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400"
      />
      
      <div className="flex items-center gap-2">
        {isArticle ? (
          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
        ) : (
          <StickyNote className="h-4 w-4 text-amber-600 flex-shrink-0" />
        )}
        <div 
          className={`font-medium truncate ${
            isArticle && data.onArticleClick 
              ? 'text-blue-600 cursor-pointer hover:underline' 
              : ''
          }`}
          onClick={isArticle && data.onArticleClick ? data.onArticleClick : undefined}
          title={data.title}
        >
          {data.title}
        </div>
      </div>
      
      {data.content && (
        <div className="mt-2 text-xs text-gray-700 line-clamp-3">
          {data.content}
        </div>
      )}
      
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-gray-400"
      />
    </div>
  )
})

CustomNode.displayName = 'CustomNode'
