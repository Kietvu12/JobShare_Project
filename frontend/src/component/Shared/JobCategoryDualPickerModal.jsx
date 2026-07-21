import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import apiService from '../../services/api'

function findCategoryNodeInTree(categories, id) {
  if (!categories?.length) return null
  const s = String(id)
  for (const cat of categories) {
    if (String(cat.id) === s) return cat
    const found = findCategoryNodeInTree(cat.children, id)
    if (found) return found
  }
  return null
}

function getCategoryAndDescendantIds(category) {
  const ids = [String(category.id)]
  if (category.children?.length) {
    category.children.forEach((child) => {
      ids.push(...getCategoryAndDescendantIds(child))
    })
  }
  return ids
}

function getAllDetailIdsUnderField(fieldInTree) {
  if (!fieldInTree?.children?.length) return []
  return fieldInTree.children.flatMap((child) => getCategoryAndDescendantIds(child))
}

function findAllDescendants(categoryId, tree) {
  const result = []
  const findInTree = (categories, targetId) => {
    for (const cat of categories) {
      if (String(cat.id) === String(targetId)) {
        const addDescendants = (children) => {
          children.forEach((child) => {
            result.push(String(child.id))
            if (child.children?.length) addDescendants(child.children)
          })
        }
        if (cat.children?.length) addDescendants(cat.children)
        return true
      }
      if (cat.children?.length && findInTree(cat.children, targetId)) return true
    }
    return false
  }
  findInTree(tree, categoryId)
  return result
}

function buildJobCategoryIdsFromState(fieldIds, jobTypeIds, categoryTree) {
  const ids = new Set()
  if (jobTypeIds?.length > 0) {
    jobTypeIds.forEach((id) => {
      const n = parseInt(String(id), 10)
      if (!Number.isNaN(n)) ids.add(n)
    })
  } else if (fieldIds?.length > 0) {
    fieldIds.forEach((fid) => {
      const node = findCategoryNodeInTree(categoryTree, fid)
      if (node) {
        getCategoryAndDescendantIds(node).forEach((rid) => {
          const n = parseInt(String(rid), 10)
          if (!Number.isNaN(n)) ids.add(n)
        })
      } else {
        const n = parseInt(String(fid), 10)
        if (!Number.isNaN(n)) ids.add(n)
      }
    })
  }
  return Array.from(ids)
}

function getCategoryDisplayName(cat, language) {
  if (!cat) return ''
  if (language === 'vi') return cat.name || ''
  if (language === 'en') return cat.nameEn || cat.name || ''
  return cat.nameJp || cat.nameEn || cat.name || ''
}

export function formatJobCategorySelection(categoryTree, flatCategories, selectedIds, language = 'vi') {
  if (!selectedIds?.length) return ''
  const idSet = new Set(selectedIds.map(String))
  const names = []
  const walk = (nodes) => {
    for (const node of nodes || []) {
      if (idSet.has(String(node.id))) names.push(getCategoryDisplayName(node, language))
      if (node.children?.length) walk(node.children)
    }
  }
  if (categoryTree?.length) {
    walk(categoryTree)
  } else {
    flatCategories
      .filter((c) => idSet.has(String(c.id)))
      .forEach((c) => names.push(getCategoryDisplayName(c, language)))
  }
  return names.join(', ')
}

function inferModalStateFromValue(value, categoryTree, flatCategories) {
  const idSet = new Set((value || []).map(String))
  const fieldIds = []
  const jobTypeIds = []

  idSet.forEach((id) => {
    const node = findCategoryNodeInTree(categoryTree, id) || flatCategories.find((c) => String(c.id) === id)
    if (!node) return
    if (!node.parentId) fieldIds.push(String(id))
    else jobTypeIds.push(String(id))
  })

  if (jobTypeIds.length > 0 && fieldIds.length === 0) {
    const roots = new Set()
    jobTypeIds.forEach((jid) => {
      let node = flatCategories.find((c) => String(c.id) === String(jid))
      while (node?.parentId) {
        node = flatCategories.find((c) => String(c.id) === String(node.parentId))
      }
      if (node) roots.add(String(node.id))
    })
    return { fieldIds: Array.from(roots), jobTypeIds }
  }

  return { fieldIds, jobTypeIds }
}

function flattenCategoryTree(tree) {
  const flattenTree = (categories, level = 0) => {
    let result = []
    categories.forEach((cat) => {
      result.push({
        ...cat,
        id: String(cat.id),
        level,
        parentId: cat.parentId ? String(cat.parentId) : null,
      })
      if (cat.children?.length) result = result.concat(flattenTree(cat.children, level + 1))
    })
    return result
  }
  return flattenTree(tree)
}

function buildTreeFromFlatList(allCategories) {
  const buildTree = (list) => {
    const map = {}
    list.forEach((cat) => { map[cat.id] = { ...cat, children: [] } })
    const roots = []
    list.forEach((cat) => {
      const node = map[cat.id]
      if (cat.parentId && map[cat.parentId]) map[cat.parentId].children.push(node)
      else roots.push(node)
    })
    roots.forEach((r) => r.children.sort((a, b) => (a.order || 0) - (b.order || 0)))
    return roots
  }
  return buildTree(allCategories)
}

async function fetchJobCategoryTreeData(useAdminAPI) {
  try {
    const treeResponse = useAdminAPI
      ? await apiService.getJobCategoryTree({ status: 1 })
      : await apiService.getCTVJobCategoryTree()
    if (treeResponse?.success && treeResponse?.data?.tree) {
      return { tree: treeResponse.data.tree, flat: flattenCategoryTree(treeResponse.data.tree) }
    }
  } catch {
    // fallback below
  }

  const response = useAdminAPI
    ? await apiService.getJobCategories({ status: 1, limit: 500 })
    : await apiService.getCTVJobCategories({ status: 1, limit: 500 })
  if (response?.success && response?.data?.categories?.length) {
    const allCategories = response.data.categories.map((cat) => ({
      id: String(cat.id),
      name: cat.name,
      nameEn: cat.nameEn,
      nameJp: cat.nameJp,
      parentId: cat.parentId ? String(cat.parentId) : null,
      order: cat.order ?? 0,
    }))
    const tree = buildTreeFromFlatList(allCategories)
    return { tree, flat: flattenCategoryTree(tree) }
  }
  return { tree: [], flat: [] }
}

function IndeterminateCheckbox({ checked, indeterminate, onChange, className }) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={className}
    />
  )
}

const COPY = {
  vi: {
    leftTitle: 'Loại công việc',
    rightTitle: 'Chi tiết',
    pickFieldFirst: 'Vui lòng chọn loại công việc bên trái trước',
    selectAll: 'Chọn tất cả',
    confirm: 'Xác nhận',
    loading: 'Đang tải...',
    placeholder: 'Chọn lĩnh vực / loại công việc',
  },
  en: {
    leftTitle: 'Job type',
    rightTitle: 'Details',
    pickFieldFirst: 'Please select a job type on the left first',
    selectAll: 'Select all',
    confirm: 'Confirm',
    loading: 'Loading...',
    placeholder: 'Select business fields / job types',
  },
  jp: {
    leftTitle: '職種',
    rightTitle: '詳細',
    pickFieldFirst: '先に左側の職種を選択してください',
    selectAll: 'すべて選択',
    confirm: '確認',
    loading: '読み込み中...',
    placeholder: '業種・職種を選択',
  },
}

/** Trigger + dual-panel modal — same UX as AgentJobsPageSession1 job type filter */
export function JobCategoryDualPickerField({
  label,
  language = 'vi',
  value = [],
  onChange,
  error,
  required = false,
  useAdminAPI = false,
  className = '',
  onTreeLoaded,
}) {
  const [open, setOpen] = useState(false)
  const [categoryTree, setCategoryTree] = useState([])
  const [flatCategories, setFlatCategories] = useState([])
  const [treeLoading, setTreeLoading] = useState(false)
  const treeLoadedRef = React.useRef(false)
  const onTreeLoadedRef = React.useRef(onTreeLoaded)
  onTreeLoadedRef.current = onTreeLoaded

  const applyTreeData = useCallback((tree, flat) => {
    setCategoryTree(tree)
    setFlatCategories(flat)
    onTreeLoadedRef.current?.(tree, flat)
  }, [])

  const loadTreeOnce = useCallback(async () => {
    if (treeLoadedRef.current) return
    treeLoadedRef.current = true
    setTreeLoading(true)
    try {
      const data = await fetchJobCategoryTreeData(useAdminAPI)
      applyTreeData(data.tree, data.flat)
    } catch (err) {
      console.error('JobCategoryDualPickerField load error:', err)
      treeLoadedRef.current = false
      applyTreeData([], [])
    } finally {
      setTreeLoading(false)
    }
  }, [applyTreeData, useAdminAPI])

  useEffect(() => {
    loadTreeOnce()
  }, [loadTreeOnce])

  const copy = COPY[language] || COPY.vi

  const displayText = useMemo(
    () => formatJobCategorySelection(categoryTree, flatCategories, value, language),
    [categoryTree, flatCategories, value, language]
  )

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-[10px] font-semibold text-slate-600">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      )}
      <div className="flex gap-1 items-center">
        <input
          type="text"
          readOnly
          value={displayText}
          placeholder={copy.placeholder}
          onClick={() => setOpen(true)}
          className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-shrink-0 rounded-lg border border-slate-200 px-2 py-2 hover:bg-slate-50"
        >
          <Plus className="h-3.5 w-3.5 text-slate-600" />
        </button>
      </div>
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
      <JobCategoryDualPickerModal
        open={open}
        onClose={() => setOpen(false)}
        language={language}
        value={value}
        categoryTree={categoryTree}
        flatCategories={flatCategories}
        loading={treeLoading}
        onConfirm={(ids) => {
          onChange?.(ids)
          setOpen(false)
        }}
      />
    </div>
  )
}

export default function JobCategoryDualPickerModal({
  open,
  onClose,
  language = 'vi',
  value = [],
  onConfirm,
  categoryTree = [],
  flatCategories = [],
  loading = false,
}) {
  const copy = COPY[language] || COPY.vi
  const [selectedFields, setSelectedFields] = useState([])
  const [jobTypeIds, setJobTypeIds] = useState([])

  const availableFields = useMemo(
    () => flatCategories.filter((c) => !c.parentId),
    [flatCategories]
  )
  const availableJobTypes = useMemo(
    () => flatCategories.filter((c) => c.parentId),
    [flatCategories]
  )

  const getName = useCallback((cat) => getCategoryDisplayName(cat, language), [language])

  useEffect(() => {
    if (!open || !categoryTree.length) return
    const { fieldIds, jobTypeIds: jtIds } = inferModalStateFromValue(value, categoryTree, flatCategories)
    setSelectedFields(fieldIds)
    setJobTypeIds(jtIds)
  }, [open, categoryTree, flatCategories, value])

  const toggleField = (fieldId) => {
    setSelectedFields((prev) => {
      const newFields = prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
      setJobTypeIds((prevJt) => prevJt.filter((jtId) => {
        const jobType = availableJobTypes.find((jt) => jt.id === jtId)
        return jobType && newFields.includes(jobType.parentId)
      }))
      return newFields
    })
  }

  const toggleJobType = (jobTypeId) => {
    setJobTypeIds((prev) => (
      prev.includes(jobTypeId) ? prev.filter((id) => id !== jobTypeId) : [...prev, jobTypeId]
    ))
  }

  const toggleJobTypeWithDescendants = (category) => {
    const idsToToggle = getCategoryAndDescendantIds(category)
    const anySelected = idsToToggle.some((id) => jobTypeIds.includes(id))
    setJobTypeIds((prev) => {
      if (anySelected) {
        const toRemove = new Set(idsToToggle)
        return prev.filter((id) => !toRemove.has(id))
      }
      const next = new Set(prev)
      idsToToggle.forEach((id) => next.add(id))
      return Array.from(next)
    })
  }

  const toggleSelectAllDetailsForField = (ids) => {
    if (!ids.length) return
    const currentSet = new Set(jobTypeIds.map(String))
    const allSelected = ids.every((id) => currentSet.has(String(id)))
    if (allSelected) {
      const toRemove = new Set(ids.map(String))
      setJobTypeIds((prev) => prev.filter((id) => !toRemove.has(String(id))))
    } else {
      setJobTypeIds((prev) => {
        const next = new Set(prev.map(String))
        ids.forEach((id) => next.add(String(id)))
        return Array.from(next)
      })
    }
  }

  const renderNestedJobTypes = (category, level = 0) => {
    if (!category.children?.length) return null
    return (
      <div className="space-y-1">
        {category.children.map((child) => {
          const childId = String(child.id)
          const hasChildren = child.children?.length > 0
          const idsInGroup = hasChildren ? getCategoryAndDescendantIds(child) : [childId]
          const isSelected = hasChildren
            ? idsInGroup.some((id) => jobTypeIds.includes(id))
            : jobTypeIds.includes(childId)
          return (
            <div key={childId}>
              <label
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                style={{ paddingLeft: `${8 + level * 20}px` }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => (hasChildren ? toggleJobTypeWithDescendants(child) : toggleJobType(childId))}
                  className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="flex-1 text-xs text-gray-900">
                  {level > 0 && <span className="mr-1 text-gray-400">└─</span>}
                  {getName(child)}
                </span>
              </label>
              {hasChildren && renderNestedJobTypes(child, level + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-1/2 flex-col border-r border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">{copy.leftTitle}</h3>
            <button type="button" onClick={onClose} className="rounded p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">{copy.loading}</div>
            ) : (
              <div className="space-y-1">
                {(categoryTree.length ? categoryTree.filter((c) => !c.parentId) : availableFields).map((cat) => {
                  const catId = String(cat.id)
                  return (
                    <label key={catId} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(catId)}
                        onChange={() => toggleField(catId)}
                        className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="flex-1 text-xs text-gray-900">{getName(cat)}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-1/2 flex-col">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">{copy.rightTitle}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">{copy.loading}</div>
            ) : selectedFields.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">{copy.pickFieldFirst}</div>
            ) : (
              <div className="space-y-4">
                {selectedFields.map((fieldId) => {
                  const fieldInTree = findCategoryNodeInTree(categoryTree, fieldId)
                  if (fieldInTree?.children?.length) {
                    const detailIds = getAllDetailIdsUnderField(fieldInTree)
                    const allChecked = detailIds.length > 0 && detailIds.every((id) => jobTypeIds.map(String).includes(String(id)))
                    const someChecked = detailIds.length > 0 && detailIds.some((id) => jobTypeIds.map(String).includes(String(id)))
                    return (
                      <div key={fieldId} className="space-y-2">
                        <label className="mb-2 flex cursor-pointer items-center gap-2 border-b border-gray-200 pb-2">
                          {detailIds.length > 0 && (
                            <IndeterminateCheckbox
                              checked={allChecked}
                              indeterminate={someChecked && !allChecked}
                              onChange={() => toggleSelectAllDetailsForField(detailIds)}
                              className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                          )}
                          <h4 className="text-sm font-medium text-gray-700">{getName(fieldInTree)}</h4>
                          {detailIds.length > 0 && <span className="text-xs text-gray-500">({copy.selectAll})</span>}
                        </label>
                        {renderNestedJobTypes(fieldInTree, 0)}
                      </div>
                    )
                  }

                  const allDescendantIds = findAllDescendants(fieldId, categoryTree)
                  const directChildren = availableJobTypes.filter((jt) => jt.parentId === fieldId)
                  const uniqueJobTypes = Array.from(
                    new Map([
                      ...directChildren,
                      ...availableJobTypes.filter((jt) => allDescendantIds.includes(jt.id) && jt.parentId !== fieldId),
                    ].map((jt) => [jt.id, jt])).values()
                  )
                  const field = availableFields.find((f) => f.id === fieldId) || fieldInTree
                  const detailIdsFlat = uniqueJobTypes.map((jt) => jt.id)
                  const allCheckedFlat = detailIdsFlat.length > 0 && detailIdsFlat.every((id) => jobTypeIds.map(String).includes(String(id)))
                  const someCheckedFlat = detailIdsFlat.length > 0 && detailIdsFlat.some((id) => jobTypeIds.map(String).includes(String(id)))

                  return (
                    <div key={fieldId} className="space-y-2">
                      <label className="mb-2 flex cursor-pointer items-center gap-2 border-b border-gray-200 pb-2">
                        {detailIdsFlat.length > 0 && (
                          <IndeterminateCheckbox
                            checked={allCheckedFlat}
                            indeterminate={someCheckedFlat && !allCheckedFlat}
                            onChange={() => toggleSelectAllDetailsForField(detailIdsFlat)}
                            className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                        )}
                        <h4 className="text-sm font-medium text-gray-700">{getName(field)}</h4>
                      </label>
                      <div className="space-y-1">
                        {uniqueJobTypes.map((jobType) => (
                          <label key={jobType.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={jobTypeIds.includes(jobType.id)}
                              onChange={() => toggleJobType(jobType.id)}
                              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-xs text-gray-900">{getName(jobType)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 p-4">
            <button
              type="button"
              onClick={() => {
                const ids = buildJobCategoryIdsFromState(selectedFields, jobTypeIds, categoryTree)
                onConfirm?.(ids)
              }}
              className="w-full rounded-lg bg-violet-600 py-2 px-4 text-xs font-semibold text-white hover:bg-violet-700"
            >
              {copy.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
