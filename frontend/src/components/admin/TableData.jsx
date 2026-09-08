import React, { useMemo, useState, useCallback } from 'react'
import './TableData.css'

const DEFAULT_SKELETON_ROWS = 5
const DEFAULT_PAGE_SIZE = 10
const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100]

const getValue = (item, column) => {
    if (column.sortValue) return column.sortValue(item)
    if (column.render) return item[column.key]
    return item[column.key]
}

const TableData = ({
    // Core props
    columns = [],
    data = [],
    loading = false,
    emptyMessage = 'Data tidak tersedia',
    actions,
    skeletonRows = DEFAULT_SKELETON_ROWS,
    mobileCardTitleKey,

    // New features
    searchable = false,
    searchPlaceholder = 'Cari...',
    searchKeys = [],
    filterable = false,
    filters = [],
    selectable = false,
    selectedKeys = [],
    onSelectChange,
    pagination = true,
    pageSize = DEFAULT_PAGE_SIZE,
    pageSizeOptions = PAGE_SIZE_OPTIONS,
    totalItems,
    currentPage = 1,
    onPageChange,
    onPageSizeChange,
    showPageInfo = true,
    showExport = false,
    onExport,
    exportLabel = 'Ekspor',
    striped = true,
    hoverable = true,
    bordered = false,
    compact = false,
    maxHeight,
    stickyHeader = true,
}) => {
    // ====== State ======
    const [sortKey, setSortKey] = useState(null)
    const [sortDirection, setSortDirection] = useState('asc')
    const [searchQuery, setSearchQuery] = useState('')
    const [filterValues, setFilterValues] = useState({})
    const [selectedLocal, setSelectedLocal] = useState([])
    const [pageLocal, setPageLocal] = useState(currentPage)
    const [pageSizeLocal, setPageSizeLocal] = useState(pageSize)

    // ====== Search & Filter ======
    const filteredData = useMemo(() => {
        let result = [...data]

        // Search
        if (searchable && searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim()
            const keys = searchKeys.length > 0 ? searchKeys : columns.map(col => col.key)

            result = result.filter(item => {
                return keys.some(key => {
                    const value = getValue(item, columns.find(col => col.key === key))
                    if (value === null || value === undefined) return false
                    return String(value).toLowerCase().includes(query)
                })
            })
        }

        // Filters
        if (filterable && filters.length > 0) {
            filters.forEach(filter => {
                const value = filterValues[filter.key]
                if (value && value !== '') {
                    result = result.filter(item => {
                        const itemValue = getValue(item, columns.find(col => col.key === filter.key))
                        if (filter.type === 'select') {
                            return String(itemValue) === String(value)
                        } else if (filter.type === 'date') {
                            // Simple date filter logic
                            const date = new Date(itemValue)
                            const filterDate = new Date(value)
                            return date.toDateString() === filterDate.toDateString()
                        } else if (filter.type === 'number') {
                            const num = Number(itemValue)
                            const filterNum = Number(value)
                            if (filter.operator === 'gt') return num > filterNum
                            if (filter.operator === 'lt') return num < filterNum
                            if (filter.operator === 'gte') return num >= filterNum
                            if (filter.operator === 'lte') return num <= filterNum
                            return num === filterNum
                        }
                        return String(itemValue).toLowerCase().includes(String(value).toLowerCase())
                    })
                }
            })
        }

        return result
    }, [data, searchable, searchQuery, searchKeys, columns, filterable, filters, filterValues])

    // ====== Sorting ======
    const sortedData = useMemo(() => {
        if (!sortKey) return filteredData

        const column = columns.find((col) => col.key === sortKey)
        if (!column) return filteredData

        const sorted = [...filteredData].sort((a, b) => {
            const valueA = getValue(a, column)
            const valueB = getValue(b, column)

            if (valueA === null || valueA === undefined) return 1
            if (valueB === null || valueB === undefined) return -1

            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return valueA - valueB
            }

            if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
                return valueA === valueB ? 0 : valueA ? 1 : -1
            }

            if (valueA instanceof Date && valueB instanceof Date) {
                return valueA.getTime() - valueB.getTime()
            }

            return String(valueA).localeCompare(String(valueB), 'id-ID', { numeric: true })
        })

        return sortDirection === 'desc' ? sorted.reverse() : sorted
    }, [filteredData, columns, sortKey, sortDirection])

    // ====== Pagination ======
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData

        const total = totalItems || sortedData.length
        const totalPages = Math.ceil(total / (pageSizeLocal || pageSize))

        const start = ((pageLocal - 1) * (pageSizeLocal || pageSize))
        const end = start + (pageSizeLocal || pageSize)

        return {
            data: sortedData.slice(start, end),
            total,
            totalPages,
            start,
            end: Math.min(end, total),
            currentPage: pageLocal,
            pageSize: pageSizeLocal || pageSize,
        }
    }, [sortedData, pagination, pageLocal, pageSizeLocal, pageSize, totalItems])

    // ====== Selection ======
    const selectedItems = useMemo(() => {
        if (selectable) {
            const keys = selectedKeys.length > 0 ? selectedKeys : selectedLocal
            return pagination ? paginatedData.data.filter(item =>
                keys.includes(item.id ?? item.key ?? JSON.stringify(item))
            ) : []
        }
        return []
    }, [selectable, selectedKeys, selectedLocal, paginatedData])

    const isAllSelected = useMemo(() => {
        if (!selectable || !pagination) return false
        const dataItems = paginatedData.data
        if (dataItems.length === 0) return false
        const keys = selectedKeys.length > 0 ? selectedKeys : selectedLocal
        return dataItems.every(item =>
            keys.includes(item.id ?? item.key ?? JSON.stringify(item))
        )
    }, [selectable, selectedKeys, selectedLocal, paginatedData])

    const handleSelectAll = useCallback(() => {
        if (!selectable) return

        const dataItems = paginatedData.data
        const itemKeys = dataItems.map(item => item.id ?? item.key ?? JSON.stringify(item))

        if (isAllSelected) {
            // Deselect all
            if (onSelectChange) {
                const newKeys = selectedKeys.filter(key => !itemKeys.includes(key))
                onSelectChange(newKeys)
            } else {
                setSelectedLocal(prev => prev.filter(key => !itemKeys.includes(key)))
            }
        } else {
            // Select all
            if (onSelectChange) {
                const newKeys = [...new Set([...selectedKeys, ...itemKeys])]
                onSelectChange(newKeys)
            } else {
                setSelectedLocal(prev => [...new Set([...prev, ...itemKeys])])
            }
        }
    }, [selectable, paginatedData, isAllSelected, selectedKeys, onSelectChange])

    const handleSelectItem = useCallback((item) => {
        if (!selectable) return

        const key = item.id ?? item.key ?? JSON.stringify(item)
        const currentKeys = selectedKeys.length > 0 ? selectedKeys : selectedLocal

        if (currentKeys.includes(key)) {
            const newKeys = currentKeys.filter(k => k !== key)
            if (onSelectChange) onSelectChange(newKeys)
            else setSelectedLocal(newKeys)
        } else {
            const newKeys = [...currentKeys, key]
            if (onSelectChange) onSelectChange(newKeys)
            else setSelectedLocal(newKeys)
        }
    }, [selectable, selectedKeys, selectedLocal, onSelectChange])

    // ====== Handlers ======
    const handleSort = (column) => {
        if (column.sortable === false) return

        if (sortKey === column.key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortKey(column.key)
            setSortDirection('asc')
        }
    }

    const handlePageChange = (page) => {
        setPageLocal(page)
        if (onPageChange) onPageChange(page)
    }

    const handlePageSizeChange = (e) => {
        const newSize = Number(e.target.value)
        setPageSizeLocal(newSize)
        setPageLocal(1)
        if (onPageSizeChange) onPageSizeChange(newSize)
    }

    const handleFilterChange = (key, value) => {
        setFilterValues(prev => ({ ...prev, [key]: value }))
        setPageLocal(1)
    }

    const clearFilters = () => {
        setFilterValues({})
        setSearchQuery('')
        setPageLocal(1)
    }

    const handleExport = () => {
        if (onExport) {
            const dataToExport = pagination ? sortedData : sortedData
            onExport(dataToExport)
        }
    }

    // ====== Render Helpers ======
    const columnCount = columns.length + (actions ? 1 : 0) + (selectable ? 1 : 0)

    const renderSortIcon = (column) => {
        if (column.sortable === false) return null

        const isActive = sortKey === column.key

        return (
            <span className={`table-sort-icon ${isActive ? 'active' : ''}`} aria-hidden="true">
                <span className={`table-sort-arrow up ${isActive && sortDirection === 'asc' ? 'on' : ''}`} />
                <span className={`table-sort-arrow down ${isActive && sortDirection === 'desc' ? 'on' : ''}`} />
            </span>
        )
    }

    // ====== Render Sections ======
    const renderToolbar = () => (
        <div className="table-toolbar">
            <div className="table-toolbar-left">
                {searchable && (
                    <div className="table-search">
                        <svg className="table-search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            className="table-search-input"
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setPageLocal(1)
                            }}
                        />
                        {searchQuery && (
                            <button className="table-search-clear" onClick={() => setSearchQuery('')}>
                                ×
                            </button>
                        )}
                    </div>
                )}

                {filterable && filters.length > 0 && (
                    <div className="table-filters">
                        {filters.map(filter => (
                            <div className="table-filter" key={filter.key}>
                                {filter.type === 'select' ? (
                                    <select
                                        className="table-filter-select"
                                        value={filterValues[filter.key] || ''}
                                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    >
                                        <option value="">{filter.label}</option>
                                        {filter.options.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : filter.type === 'date' ? (
                                    <input
                                        type="date"
                                        className="table-filter-input"
                                        value={filterValues[filter.key] || ''}
                                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        className="table-filter-input"
                                        placeholder={filter.label}
                                        value={filterValues[filter.key] || ''}
                                        onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                        {(searchQuery || Object.values(filterValues).some(v => v)) && (
                            <button className="table-filter-clear" onClick={clearFilters}>
                                Reset Filter
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="table-toolbar-right">
                {showExport && onExport && (
                    <button className="table-export-btn" onClick={handleExport}>
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {exportLabel}
                    </button>
                )}

                {selectable && selectedItems.length > 0 && (
                    <span className="table-selected-info">
                        {selectedItems.length} terpilih
                    </span>
                )}
            </div>
        </div>
    )

    const renderPagination = () => {
        if (!pagination) return null
        const { total, totalPages, currentPage: page, start, end, pageSize: size } = paginatedData

        return (
            <div className="table-pagination">
                <div className="table-pagination-left">
                    {showPageInfo && total > 0 && (
                        <span className="table-pagination-info">
                            Menampilkan {start + 1}-{end} dari {total} data
                        </span>
                    )}

                    <div className="table-pagination-size">
                        <label>Baris per halaman</label>
                        <select value={size} onChange={handlePageSizeChange}>
                            {pageSizeOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="table-pagination-right">
                    <button
                        className="table-pagination-btn"
                        disabled={page <= 1}
                        onClick={() => handlePageChange(page - 1)}
                    >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="table-pagination-pages">
                        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 7) {
                                pageNum = i + 1
                            } else if (page <= 4) {
                                pageNum = i + 1
                                if (i === 6) pageNum = totalPages
                            } else if (page >= totalPages - 3) {
                                pageNum = totalPages - 6 + i
                            } else {
                                pageNum = page - 3 + i
                            }

                            if (i === 0 && pageNum !== 1 && totalPages > 7) {
                                return (
                                    <React.Fragment key="start-ellipsis">
                                        <button
                                            className="table-pagination-btn"
                                            onClick={() => handlePageChange(1)}
                                        >
                                            1
                                        </button>
                                        <span className="table-pagination-ellipsis">…</span>
                                    </React.Fragment>
                                )
                            }

                            if (i === 6 && pageNum !== totalPages && totalPages > 7) {
                                return (
                                    <React.Fragment key="end-ellipsis">
                                        <span className="table-pagination-ellipsis">…</span>
                                        <button
                                            className="table-pagination-btn"
                                            onClick={() => handlePageChange(totalPages)}
                                        >
                                            {totalPages}
                                        </button>
                                    </React.Fragment>
                                )
                            }

                            return (
                                <button
                                    key={pageNum}
                                    className={`table-pagination-btn ${pageNum === page ? 'active' : ''}`}
                                    onClick={() => handlePageChange(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            )
                        })}
                    </div>

                    <button
                        className="table-pagination-btn"
                        disabled={page >= totalPages}
                        onClick={() => handlePageChange(page + 1)}
                    >
                        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        )
    }

    const renderSkeleton = () => (
        <>
            <table className={`admin-table admin-table-skeleton ${compact ? 'compact' : ''}`} aria-hidden="true">
                <thead>
                    <tr>
                        {selectable && <th className="table-col-checkbox" />}
                        <th className="table-col-no">No</th>
                        {columns.map((column) => (
                            <th key={column.key}>{column.label}</th>
                        ))}
                        {actions && <th>Aksi</th>}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {selectable && (
                                <td>
                                    <div className="skeleton-bar skeleton-bar-checkbox" />
                                </td>
                            )}
                            <td>
                                <div className="skeleton-bar skeleton-bar-narrow" />
                            </td>
                            {columns.map((column) => (
                                <td key={column.key}>
                                    <div className="skeleton-bar" />
                                </td>
                            ))}
                            {actions && (
                                <td>
                                    <div className="skeleton-bar skeleton-bar-narrow" />
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="table-cards table-cards-skeleton" aria-hidden="true">
                {Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                    <div className="table-card" key={rowIndex}>
                        <div className="skeleton-bar skeleton-bar-title" />
                        <div className="skeleton-bar" />
                        <div className="skeleton-bar skeleton-bar-narrow" />
                    </div>
                ))}
            </div>
        </>
    )

    const renderDesktopTable = () => {
        const displayData = pagination ? paginatedData.data : sortedData

        return (
            <div className="table-scroll-wrapper" style={{ maxHeight }}>
                <table className={`admin-table ${striped ? 'striped' : ''} ${hoverable ? 'hoverable' : ''} ${bordered ? 'bordered' : ''} ${compact ? 'compact' : ''}`}>
                    <thead className={stickyHeader ? 'sticky' : ''}>
                        <tr>
                            {selectable && (
                                <th className="table-col-checkbox">
                                    <label className="table-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={isAllSelected}
                                            onChange={handleSelectAll}
                                            disabled={paginatedData.data.length === 0}
                                        />
                                        <span className="table-checkbox-indicator" />
                                    </label>
                                </th>
                            )}
                            <th className="table-col-no">No</th>

                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={column.sortable === false ? '' : 'sortable'}
                                    onClick={() => handleSort(column)}
                                    style={{ width: column.width }}
                                    aria-sort={
                                        sortKey === column.key
                                            ? sortDirection === 'asc'
                                                ? 'ascending'
                                                : 'descending'
                                            : undefined
                                    }
                                >
                                    <span className="table-th-content">
                                        {column.label}
                                        {renderSortIcon(column)}
                                    </span>
                                </th>
                            ))}

                            {actions && <th>Aksi</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {displayData.length > 0 ? (
                            displayData.map((item, index) => {
                                const isSelected = selectable && (selectedKeys.length > 0
                                    ? selectedKeys.includes(item.id ?? item.key ?? JSON.stringify(item))
                                    : selectedLocal.includes(item.id ?? item.key ?? JSON.stringify(item))
                                )

                                return (
                                    <tr
                                        key={item.id ?? item.key ?? index}
                                        className={isSelected ? 'selected' : ''}
                                    >
                                        {selectable && (
                                            <td className="table-col-checkbox">
                                                <label className="table-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectItem(item)}
                                                    />
                                                    <span className="table-checkbox-indicator" />
                                                </label>
                                            </td>
                                        )}
                                        <td className="table-col-no">{(pagination ? paginatedData.start : 0) + index + 1}</td>

                                        {columns.map((column) => (
                                            <td key={column.key}>
                                                {column.render ? column.render(item) : item[column.key]}
                                            </td>
                                        ))}

                                        {actions && <td className="table-actions">{actions(item)}</td>}
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={columnCount} className="table-empty">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )
    }

    const renderMobileCards = () => {
        const displayData = pagination ? paginatedData.data : sortedData

        if (displayData.length === 0) {
            return <div className="table-empty table-empty-card">{emptyMessage}</div>
        }

        return (
            <div className="table-cards">
                {displayData.map((item, index) => {
                    const titleColumn = mobileCardTitleKey
                        ? columns.find((col) => col.key === mobileCardTitleKey)
                        : columns[0]

                    const titleValue = titleColumn
                        ? titleColumn.render
                            ? titleColumn.render(item)
                            : item[titleColumn.key]
                        : `Data ${index + 1}`

                    const restColumns = titleColumn
                        ? columns.filter((col) => col.key !== titleColumn.key)
                        : columns

                    const isSelected = selectable && (selectedKeys.length > 0
                        ? selectedKeys.includes(item.id ?? item.key ?? JSON.stringify(item))
                        : selectedLocal.includes(item.id ?? item.key ?? JSON.stringify(item))
                    )

                    return (
                        <div className={`table-card ${isSelected ? 'selected' : ''}`} key={item.id ?? item.key ?? index}>
                            {selectable && (
                                <div className="table-card-checkbox">
                                    <label className="table-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => handleSelectItem(item)}
                                        />
                                        <span className="table-checkbox-indicator" />
                                    </label>
                                </div>
                            )}
                            <div className="table-card-header">
                                <span className="table-card-index">#{(pagination ? paginatedData.start : 0) + index + 1}</span>
                                <span className="table-card-title">{titleValue}</span>
                            </div>

                            <dl className="table-card-body">
                                {restColumns.map((column) => (
                                    <div className="table-card-row" key={column.key}>
                                        <dt>{column.label}</dt>
                                        <dd>{column.render ? column.render(item) : item[column.key]}</dd>
                                    </div>
                                ))}
                            </dl>

                            {actions && <div className="table-card-actions">{actions(item)}</div>}
                        </div>
                    )
                })}
            </div>
        )
    }

    // ====== Main Render ======
    return (
        <div className={`table-wrapper ${compact ? 'compact' : ''}`}>
            {(searchable || filterable || selectable || showExport) && renderToolbar()}

            {loading ? (
                renderSkeleton()
            ) : (
                <>
                    {renderDesktopTable()}
                    {renderMobileCards()}
                </>
            )}

            {pagination && !loading && renderPagination()}
        </div>
    )
}

export default TableData