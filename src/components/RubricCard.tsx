'use client'

import { useState } from 'react'
import { RubricItem } from '@/types'
import { Edit2, Trash2, GripVertical, Star } from 'lucide-react'

interface RubricCardProps {
  item: RubricItem
  index: number
  onEdit: (index: number, newItem: RubricItem, justification: string) => void
  onDelete: (index: number, justification: string) => void
}

export function RubricCard({ item, index, onEdit, onDelete }: RubricCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editedItem, setEditedItem] = useState<RubricItem>(item)
  const [editJustification, setEditJustification] = useState('')
  const [deleteJustification, setDeleteJustification] = useState('')

  const handleEdit = () => {
    if (editJustification.trim()) {
      onEdit(index, editedItem, editJustification)
      setShowEditModal(false)
      setEditJustification('')
    }
  }

  const handleDelete = () => {
    if (deleteJustification.trim()) {
      onDelete(index, deleteJustification)
      setShowDeleteModal(false)
      setDeleteJustification('')
    }
  }

  // Determine border color based on points
  const getBorderClass = () => {
    if (item.points <= 3) return 'rubric-card-low'
    if (item.points <= 7) return 'rubric-card-medium'
    return 'rubric-card-high'
  }

  return (
    <>
      <div className={`card ${getBorderClass()}`} style={{ transition: 'all 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          {/* Drag handle */}
          <div className="cursor-move" style={{ color: '#94A3B8', cursor: 'move' }}>
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h3 style={{ fontWeight: 500, color: 'var(--color-foreground)' }}>
              {item.criterion}
            </h3>
            
            {/* Points display with stars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4"
                  style={{
                    fill: i < item.points ? '#FBBF24' : '#E5E7EB',
                    color: i < item.points ? '#FBBF24' : '#E5E7EB'
                  }}
                />
              ))}
              <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#64748B' }}>
                {item.points} {item.points === 1 ? 'point' : 'points'}
              </span>
            </div>

            {item.justification && (
              <p style={{ fontSize: '0.875rem', color: '#64748B' }}>
                {item.justification}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label="Edit criterion"
            >
              <Edit2 className="h-4 w-4" style={{ color: '#64748B' }} />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                padding: '0.5rem',
                borderRadius: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#FEE2E2'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              aria-label="Delete criterion"
            >
              <Trash2 className="h-4 w-4" style={{ color: '#EF4444' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50
        }}>
          <div className="modal-content animate-slide-up">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Edit Criterion</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Criterion</label>
                <input
                  type="text"
                  value={editedItem.criterion}
                  onChange={(e) => setEditedItem({ ...editedItem, criterion: e.target.value })}
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Points (1-5)</label>
                <input
                  type="number"
                  value={editedItem.points}
                  onChange={(e) => setEditedItem({ ...editedItem, points: parseInt(e.target.value) || 1 })}
                  className="input"
                  style={{ width: '6rem' }}
                  min="1"
                  max="5"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Justification</label>
                <textarea
                  value={editedItem.justification}
                  onChange={(e) => setEditedItem({ ...editedItem, justification: e.target.value })}
                  className="textarea"
                  rows={3}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Why are you editing this?</label>
                <textarea
                  value={editJustification}
                  onChange={(e) => setEditJustification(e.target.value)}
                  className="textarea"
                  placeholder="Why are you tweaking this criterion?"
                  rows={3}
                  maxLength={300}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                  {editJustification.length}/300
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditedItem(item)
                  setEditJustification('')
                }}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!editJustification.trim()}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50
        }}>
          <div className="modal-content animate-slide-up">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Remove Criterion</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#FEE2E2', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#991B1B' }}>
                  Are you sure you want to remove this criterion?
                </p>
                <p style={{ marginTop: '0.5rem', fontWeight: 500, color: '#7F1D1D' }}>
                  "{item.criterion}"
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Why are you removing this?</label>
                <textarea
                  value={deleteJustification}
                  onChange={(e) => setDeleteJustification(e.target.value)}
                  className="textarea"
                  placeholder="Why are you removing this criterion?"
                  rows={3}
                  maxLength={300}
                />
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                  {deleteJustification.length}/300
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteJustification('')
                }}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!deleteJustification.trim()}
                className="btn-primary"
                style={{ flex: 1, background: '#EF4444' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-content {
          background: white;
          border-radius: 1rem;
          padding: 1.5rem;
          max-width: 28rem;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
        }
        
        .dark .modal-content {
          background: #1E293B;
        }
      `}</style>
    </>
  )
} 