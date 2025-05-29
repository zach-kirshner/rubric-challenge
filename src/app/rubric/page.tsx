'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Save, CheckCircle2, XCircle, Edit3, Trash2, GripVertical, ArrowLeft } from 'lucide-react'
import SortableItem from '@/components/SortableItem'
import JustificationModal from '@/components/JustificationModal'
import { RubricItem, Action } from '@/types'

export default function RubricPage() {
  const router = useRouter()
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([])
  const [originalItems, setOriginalItems] = useState<RubricItem[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [prompt, setPrompt] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showJustificationModal, setShowJustificationModal] = useState(false)
  const [currentAction, setCurrentAction] = useState<Partial<Action> | null>(null)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [newCriterion, setNewCriterion] = useState('')
  const [newIsPositive, setNewIsPositive] = useState(true)
  const [newJustification, setNewJustification] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const addFormRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const data = sessionStorage.getItem('rubricData')
    const userEmail = sessionStorage.getItem('userEmail')
    const userName = sessionStorage.getItem('userName')
    
    if (!data || !userEmail || !userName) {
      router.push('/prompt')
      return
    }

    const { prompt: savedPrompt, rubricItems: savedItems } = JSON.parse(data)
    setPrompt(savedPrompt)
    setEmail(userEmail)
    setFullName(userName)
    setRubricItems(savedItems)
    setOriginalItems(savedItems)
  }, [router])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (rubricItems.length > 0 && !isSubmitting) {
          handleSubmit()
        }
      }
      // Ctrl/Cmd + A to add new
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault()
        setShowAddForm(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [rubricItems.length, isSubmitting])

  // Scroll to add form when it's shown
  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      // Small delay to ensure the form is rendered
      setTimeout(() => {
        addFormRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        })
      }, 100)
    }
  }, [showAddForm])

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setRubricItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleEdit = (item: RubricItem) => {
    console.log('Edit button clicked for item:', item.id)
    setEditingItem(item.id)
    setEditText(item.criterion)
  }

  const handleSaveEdit = (item: RubricItem) => {
    console.log('Save edit clicked for item:', item.id)
    if (editText.trim() === item.criterion) {
      setEditingItem(null)
      return
    }
    
    setCurrentAction({
      type: 'edit',
      itemId: item.id,
      originalText: item.criterion,
      newText: editText.trim(),
    })
    setShowJustificationModal(true)
  }

  const handleDelete = (item: RubricItem) => {
    console.log('Delete button clicked for item:', item.id)
    setCurrentAction({
      type: 'delete',
      itemId: item.id,
      originalText: item.criterion,
    })
    setShowJustificationModal(true)
  }

  const handleAdd = () => {
    setCurrentAction({
      type: 'add',
      newText: '',
    })
    setShowJustificationModal(true)
  }

  const handleJustificationSubmit = (justification: string) => {
    if (!currentAction) return

    const action: Action = {
      ...currentAction,
      justification,
      timestamp: new Date().toISOString(),
    } as Action

    if (action.type === 'edit' && action.newText) {
      setRubricItems(items =>
        items.map(item =>
          item.id === action.itemId
            ? { ...item, criterion: action.newText! }
            : item
        )
      )
      setEditingItem(null)
      setEditText('')
    } else if (action.type === 'delete') {
      setRubricItems(items => items.filter(item => item.id !== action.itemId))
    }

    setActions([...actions, action])
    setShowJustificationModal(false)
    setCurrentAction(null)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          fullName,
          prompt,
          originalRubricItems: originalItems,
          finalRubricItems: rubricItems,
          actions
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      const data = await response.json()
      
      if (data.success) {
        // Clear local storage
        localStorage.removeItem('rubricItems')
        localStorage.removeItem('rubricActions')
        
        // Redirect to thank you page
        router.push('/thank-you')
      } else {
        throw new Error(data.error || 'Submission failed')
      }
    } catch (error) {
      console.error('Error submitting:', error)
      alert('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stats = {
    added: actions.filter(a => a.type === 'add').length,
    edited: actions.filter(a => a.type === 'edit').length,
    deleted: actions.filter(a => a.type === 'delete').length,
  }

  const handleAddNew = () => {
    if (!newCriterion.trim()) return;
    
    const newItem: RubricItem = {
      id: `new-${Date.now()}`,
      criterion: newCriterion,
      isPositive: newIsPositive,
    };
    
    setRubricItems([...rubricItems, newItem]);
    setActions([...actions, {
      type: 'add',
      itemId: newItem.id,
      newText: newCriterion,
      justification: newJustification,
      timestamp: new Date().toISOString(),
    }]);
    
    setNewCriterion('');
    setNewIsPositive(true);
    setNewJustification('');
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ 
            background: 'radial-gradient(circle, var(--gradient-mid), transparent)',
            filter: 'blur(80px)'
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/prompt')}
                className="icon-button"
                title="Back to prompt"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-2xl font-bold">
                Review Criteria
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                  {rubricItems.length} criteria
                </span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-3">
              {stats.added > 0 && (
                <div className="chip chip-added">
                  <Plus className="w-3 h-3" />
                  {stats.added} added
                </div>
              )}
              {stats.edited > 0 && (
                <div className="chip chip-edited">
                  <Edit3 className="w-3 h-3" />
                  {stats.edited} edited
                </div>
              )}
              {stats.deleted > 0 && (
                <div className="chip chip-removed">
                  <Trash2 className="w-3 h-3" />
                  {stats.deleted} deleted
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Instructions */}
        <div className="card glass mb-6 animate-in">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              <Edit3 className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Review and refine criteria</h3>
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Edit, delete, reorder, or add new criteria. Each change requires a justification.
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--color-muted-foreground)' }}>
                Shortcuts: <kbd className="kbd">Ctrl+S</kbd> to submit • <kbd className="kbd">Ctrl+A</kbd> to add new • <kbd className="kbd">Esc</kbd> to close modals
              </p>
            </div>
          </div>
        </div>

        {/* Rubric items */}
        <div className="space-y-3 mb-8">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={rubricItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {rubricItems.map((item, index) => (
                <div key={item.id} className="animate-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <SortableItem id={item.id}>
                    {({ dragHandleProps }) => (
                      <div className="card hover-lift">
                        <div className="flex items-start gap-4">
                          <button
                            type="button"
                            className="drag-handle p-2 cursor-grab active:cursor-grabbing touch-none"
                            {...dragHandleProps}
                          >
                            <GripVertical className="w-5 h-5" style={{ color: 'var(--color-muted-foreground)' }} />
                          </button>
                          
                          <div className="flex-1">
                            {editingItem === item.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="textarea"
                                  rows={3}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                      handleSaveEdit(item)
                                    } else if (e.key === 'Escape') {
                                      setEditingItem(null)
                                      setEditText('')
                                    }
                                  }}
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => {
                                      setEditingItem(null)
                                      setEditText('')
                                    }}
                                    className="btn-secondary text-sm"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEdit(item)}
                                    disabled={!editText.trim() || editText.trim() === item.criterion}
                                    className="btn-primary text-sm"
                                  >
                                    Save & Justify
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start gap-3">
                                  <div 
                                    className="mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                                    style={{ 
                                      background: item.isPositive !== false 
                                        ? 'linear-gradient(135deg, #10B981, #34D399)' 
                                        : 'linear-gradient(135deg, #EF4444, #F87171)',
                                      color: 'white'
                                    }}
                                  >
                                    {item.isPositive !== false ? '+' : '-'}
                                  </div>
                                  <p className="flex-1 text-sm leading-relaxed">
                                    {item.criterion}
                                  </p>
                                </div>
                                
                                <div className="flex gap-2 mt-3 justify-end">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="icon-button"
                                    title="Edit criterion"
                                    type="button"
                                    style={{ position: 'relative', zIndex: 10 }}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item)}
                                    className="icon-button"
                                    title="Delete criterion"
                                    type="button"
                                    style={{ position: 'relative', zIndex: 10 }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </SortableItem>
                </div>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Add new criterion button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full card hover-lift border-2 border-dashed flex items-center justify-center gap-2 py-4 transition-all"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Plus className="w-5 h-5" style={{ color: 'var(--gradient-mid)' }} />
          <span className="font-medium">Add New Criterion</span>
        </button>

        {/* Add new criterion form */}
        {showAddForm && (
          <div ref={addFormRef} className="card card-elevated animate-in mt-6">
            <h3 className="text-lg font-semibold mb-4">Add New Criterion</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Criterion Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewIsPositive(true)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                      newIsPositive 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">✓</span>
                      <span className="font-medium">Positive Criterion</span>
                    </div>
                    <p className="text-xs mt-1 opacity-70">Awards credit for correct answers</p>
                  </button>
                  <button
                    onClick={() => setNewIsPositive(false)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                      !newIsPositive 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">✗</span>
                      <span className="font-medium">Negative Criterion</span>
                    </div>
                    <p className="text-xs mt-1 opacity-70">Deducts credit for mistakes</p>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-criterion" className="block text-sm font-medium mb-2">
                  Criterion Description
                </label>
                <textarea
                  id="new-criterion"
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  placeholder={newIsPositive 
                    ? "e.g., States that the company's revenue for 2023 is $45.2M" 
                    : "e.g., Recommends option X despite constraint Y"}
                  className="textarea"
                  rows={3}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="new-justification" className="block text-sm font-medium mb-2">
                  Justification
                </label>
                <textarea
                  id="new-justification"
                  value={newJustification}
                  onChange={(e) => setNewJustification(e.target.value)}
                  placeholder="Enter justification for adding this criterion"
                  className="textarea"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewCriterion('')
                    setNewJustification('')
                    setNewIsPositive(true)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNew}
                  disabled={!newCriterion.trim() || !newJustification.trim()}
                  className="btn-primary"
                >
                  Add Criterion
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-40 glass" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Make sure your rubric accurately reflects your evaluation criteria
            </p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || rubricItems.length === 0}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit Rubric
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Justification Modal */}
      <JustificationModal
        isOpen={showJustificationModal}
        onClose={() => {
          setShowJustificationModal(false)
          setCurrentAction(null)
          setEditingItem(null)
          setEditText('')
        }}
        onConfirm={handleJustificationSubmit}
        action={currentAction}
      />
    </div>
  )
} 