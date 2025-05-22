"use client"

import { useCallback, useRef, useState, useEffect } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  Panel,
  NodeTypes,
  ConnectionLineType,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from '@/components/ui/button'
import { Plus, Link, Trash2, Save, FileText, StickyNote, X, Maximize, Minimize, ZoomIn, ZoomOut, Move } from 'lucide-react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CustomNode } from './custom-node'

// Define node types
const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

// Define initial nodes and edges
const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export interface DotMapsProps {
  mapId: string
  onSelectArticle?: (title: string) => void
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export default function DotMaps({ 
  mapId, 
  onSelectArticle, 
  isFullscreen = false,
  onToggleFullscreen
}: DotMapsProps) {
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  
  // State for UI controls
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [isConnectMode, setIsConnectMode] = useState(false)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false)
  const [nodeDetailsOpen, setNodeDetailsOpen] = useState(false)
  
  // Form state
  const [nodeTitle, setNodeTitle] = useState('')
  const [nodeContent, setNodeContent] = useState('')
  const [nodeType, setNodeType] = useState('note')
  
  // Refs
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)

  // Load saved map data
  useEffect(() => {
    const savedMap = localStorage.getItem(`dotmap-${mapId}`)
    if (savedMap) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedMap)
        setNodes(savedNodes)
        setEdges(savedEdges)
      } catch (error) {
        console.error('Error loading saved map:', error)
      }
    }
  }, [mapId, setNodes, setEdges])

  // Save map data when it changes
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      localStorage.setItem(`dotmap-${mapId}`, JSON.stringify({ nodes, edges }))
    }
  }, [nodes, edges, mapId])

  // Handle node click
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (isDeleteMode) {
      setNodes((nds) => nds.filter((n) => n.id !== node.id))
      setEdges((eds) => eds.filter((e) => e.source !== node.id && e.target !== node.id))
    } else if (isConnectMode) {
      // In connect mode, select the first node, then connect to the second node
      if (!selectedNode) {
        setSelectedNode(node)
      } else if (selectedNode.id !== node.id) {
        // Create a new edge
        const newEdge = {
          id: `e${selectedNode.id}-${node.id}`,
          source: selectedNode.id,
          target: node.id,
          type: 'smoothstep',
          animated: false,
          style: { strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }
        setEdges((eds) => addEdge(newEdge, eds))
        setSelectedNode(null)
      }
    } else {
      // Regular mode - show node details
      setSelectedNode(node)
      setNodeDetailsOpen(true)
    }
  }, [isDeleteMode, isConnectMode, selectedNode, setNodes, setEdges])

  // Handle pane click (background)
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    if (isAddingNode && reactFlowInstance) {
      // Get position in the flow
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      
      // Open dialog to create a new node
      setNodeTitle('')
      setNodeContent('')
      setNodeType('note')
      setNodeDialogOpen(true)
      
      // Store the position for later use when creating the node
      setSelectedNode({ position } as any)
    } else if (isConnectMode && selectedNode) {
      // Cancel connection if clicking on the background
      setSelectedNode(null)
    }
  }, [isAddingNode, isConnectMode, selectedNode, reactFlowInstance])

  // Handle edge connection
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  // Create a new node
  const createNode = useCallback(() => {
    if (!selectedNode?.position) return
    
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: selectedNode.position,
      data: { 
        title: nodeTitle || 'Untitled',
        content: nodeContent,
        type: nodeType,
        onArticleClick: nodeType === 'article' && onSelectArticle ? 
          () => onSelectArticle(nodeTitle) : undefined
      },
    }
    
    setNodes((nds) => [...nds, newNode])
    setNodeDialogOpen(false)
    setIsAddingNode(false)
  }, [selectedNode, nodeTitle, nodeContent, nodeType, setNodes, onSelectArticle])

  // Update an existing node
  const updateNode = useCallback(() => {
    if (!selectedNode) return
    
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              title: nodeTitle,
              content: nodeContent,
              type: nodeType,
              onArticleClick: nodeType === 'article' && onSelectArticle ? 
                () => onSelectArticle(nodeTitle) : undefined
            },
          }
        }
        return node
      })
    )
    
    setNodeDetailsOpen(false)
  }, [selectedNode, nodeTitle, nodeContent, nodeType, setNodes, onSelectArticle])

  // Toggle modes
  const toggleAddMode = useCallback(() => {
    setIsAddingNode(!isAddingNode)
    setIsConnectMode(false)
    setIsDeleteMode(false)
    setSelectedNode(null)
  }, [isAddingNode])

  const toggleConnectMode = useCallback(() => {
    setIsConnectMode(!isConnectMode)
    setIsAddingNode(false)
    setIsDeleteMode(false)
    setSelectedNode(null)
  }, [isConnectMode])

  const toggleDeleteMode = useCallback(() => {
    setIsDeleteMode(!isDeleteMode)
    setIsAddingNode(false)
    setIsConnectMode(false)
    setSelectedNode(null)
  }, [isDeleteMode])

  // Set up node details when a node is selected
  useEffect(() => {
    if (selectedNode && selectedNode.data) {
      setNodeTitle(selectedNode.data.title || '')
      setNodeContent(selectedNode.data.content || '')
      setNodeType(selectedNode.data.type || 'note')
    }
  }, [selectedNode])

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        }}
        fitView
      >
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Background variant="dots" gap={12} size={1} />
        
        {/* Control Panel */}
        <Panel position="top-left" className="bg-white p-2 rounded-md shadow-md flex gap-2">
          <Button
            size="sm"
            variant={isAddingNode ? "default" : "outline"}
            onClick={toggleAddMode}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
          
          <Button
            size="sm"
            variant={isConnectMode ? "default" : "outline"}
            onClick={toggleConnectMode}
            className="flex items-center gap-1"
          >
            <Link className="h-4 w-4" />
            <span className="hidden sm:inline">Connect</span>
          </Button>
          
          <Button
            size="sm"
            variant={isDeleteMode ? "default" : "outline"}
            onClick={toggleDeleteMode}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
          
          {onToggleFullscreen && (
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleFullscreen}
              className="flex items-center gap-1"
            >
              {isFullscreen ? (
                <>
                  <Minimize className="h-4 w-4" />
                  <span className="hidden sm:inline">Exit</span>
                </>
              ) : (
                <>
                  <Maximize className="h-4 w-4" />
                  <span className="hidden sm:inline">Expand</span>
                </>
              )}
            </Button>
          )}
        </Panel>
        
        {/* Status indicator */}
        {(isAddingNode || isConnectMode || isDeleteMode || selectedNode) && (
          <Panel position="top-center" className="bg-white p-2 rounded-md shadow-md">
            {isAddingNode && "Click anywhere to add a new node"}
            {isConnectMode && !selectedNode && "Select a source node"}
            {isConnectMode && selectedNode && "Now select a target node"}
            {isDeleteMode && "Click on a node to delete it"}
          </Panel>
        )}
      </ReactFlow>
      
      {/* New Node Dialog */}
      <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Node</DialogTitle>
            <DialogDescription>
              Add details for your new knowledge node.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={nodeTitle}
                onChange={(e) => setNodeTitle(e.target.value)}
                className="col-span-3"
                placeholder="Node title"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content" className="text-right">
                Content
              </Label>
              <Textarea
                id="content"
                value={nodeContent}
                onChange={(e) => setNodeContent(e.target.value)}
                className="col-span-3"
                placeholder="Node content or description"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Type</Label>
              <RadioGroup 
                value={nodeType} 
                onValueChange={setNodeType}
                className="col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="note" id="note" />
                  <Label htmlFor="note" className="flex items-center gap-1">
                    <StickyNote className="h-4 w-4" />
                    Note
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="article" id="article" />
                  <Label htmlFor="article" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Article
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createNode}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Node Details Dialog */}
      <Dialog open={nodeDetailsOpen} onOpenChange={setNodeDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Node Details</DialogTitle>
            <DialogDescription>
              View or edit this knowledge node.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Title
              </Label>
              <Input
                id="edit-title"
                value={nodeTitle}
                onChange={(e) => setNodeTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-content" className="text-right">
                Content
              </Label>
              <Textarea
                id="edit-content"
                value={nodeContent}
                onChange={(e) => setNodeContent(e.target.value)}
                className="col-span-3"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Type</Label>
              <RadioGroup 
                value={nodeType} 
                onValueChange={setNodeType}
                className="col-span-3 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="note" id="edit-note" />
                  <Label htmlFor="edit-note" className="flex items-center gap-1">
                    <StickyNote className="h-4 w-4" />
                    Note
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="article" id="edit-article" />
                  <Label htmlFor="edit-article" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Article
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNodeDetailsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateNode}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
