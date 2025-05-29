'use client'

import React, { useState } from 'react'
import { Submission } from '@/types'
import { ChevronDown, ChevronUp, Edit2, Trash2, PlusCircle } from 'lucide-react'

interface AdminTableProps {
  submissions: Submission[]
}

export function AdminTable({ submissions }: AdminTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-4 font-medium text-sm text-slate-700 dark:text-slate-300">
              User
            </th>
            <th className="text-left py-3 px-4 font-medium text-sm text-slate-700 dark:text-slate-300">
              Submitted
            </th>
            <th className="text-center py-3 px-4 font-medium text-sm text-slate-700 dark:text-slate-300">
              Actions
            </th>
            <th className="text-center py-3 px-4 font-medium text-sm text-slate-700 dark:text-slate-300">
              Final Criteria
            </th>
            <th className="text-center py-3 px-4 font-medium text-sm text-slate-700 dark:text-slate-300">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => {
            const isExpanded = expandedRows.has(submission.id)
            const addedCount = submission.actions.filter(a => a.type === 'add').length
            const editedCount = submission.actions.filter(a => a.type === 'edit').length
            const deletedCount = submission.actions.filter(a => a.type === 'delete').length

            return (
              <React.Fragment key={submission.id}>
                <tr className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-sm">User #{submission.userId.slice(0, 8)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ID: {submission.userId.slice(0, 8)}...
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {new Date(submission.createdAt).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {addedCount > 0 && (
                        <span className="chip chip-added text-xs">
                          <PlusCircle className="h-3 w-3" />
                          {addedCount}
                        </span>
                      )}
                      {editedCount > 0 && (
                        <span className="chip chip-edited text-xs">
                          <Edit2 className="h-3 w-3" />
                          {editedCount}
                        </span>
                      )}
                      {deletedCount > 0 && (
                        <span className="chip chip-removed text-xs">
                          <Trash2 className="h-3 w-3" />
                          {deletedCount}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-sm font-medium">
                      {submission.rubricFinal.length}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => toggleRow(submission.id)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan={5} className="bg-slate-50 dark:bg-slate-800/30 p-6">
                      <div className="space-y-6">
                        {/* Prompt */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Task Prompt</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-4 rounded-lg">
                            {submission.prompt}
                          </p>
                        </div>

                        {/* Actions */}
                        {submission.actions.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Actions Taken</h4>
                            <div className="space-y-3">
                              {submission.actions.map((action) => (
                                <div
                                  key={action.id}
                                  className="bg-white dark:bg-slate-800 p-4 rounded-lg"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        {action.type === 'add' && (
                                          <span className="chip chip-added text-xs">
                                            <PlusCircle className="h-3 w-3" />
                                            Added
                                          </span>
                                        )}
                                        {action.type === 'edit' && (
                                          <span className="chip chip-edited text-xs">
                                            <Edit2 className="h-3 w-3" />
                                            Edited
                                          </span>
                                        )}
                                        {action.type === 'delete' && (
                                          <span className="chip chip-removed text-xs">
                                            <Trash2 className="h-3 w-3" />
                                            Removed
                                          </span>
                                        )}
                                      </div>
                                      
                                      {action.type === 'edit' && action.itemBefore && action.itemAfter && (
                                        <div className="space-y-2 text-sm">
                                          <div>
                                            <span className="text-slate-500">Before:</span>
                                            <p className="text-slate-600 dark:text-slate-400">
                                              {action.itemBefore.criterion}
                                            </p>
                                          </div>
                                          <div>
                                            <span className="text-slate-500">After:</span>
                                            <p className="text-slate-900 dark:text-slate-100">
                                              {action.itemAfter.criterion}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {action.type === 'add' && action.itemAfter && (
                                        <p className="text-sm text-slate-900 dark:text-slate-100">
                                          {action.itemAfter.criterion}
                                        </p>
                                      )}
                                      
                                      {action.type === 'delete' && action.itemBefore && (
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-through">
                                          {action.itemBefore.criterion}
                                        </p>
                                      )}
                                      
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                        Justification: {action.justification}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
} 