import React, { useEffect, useRef, useState } from 'react'
import './Modal.css'

const ICONS = {
    default: null,
    danger: '⚠',
    success: '✓',
}

const DRAG_CLOSE_THRESHOLD = 120 // px ditarik sebelum dianggap "lepas untuk menutup"

export default function Modal({
    isOpen,
    title = 'Modal',
    children,
    onClose,
    footer,
    size = 'medium',
    tone = 'default', // 'default' | 'danger' | 'success'
    closeOnOverlayClick = true,
    closeOnEscape = true,
}) {
    const [shouldRender, setShouldRender] = useState(isOpen)
    const [isClosing, setIsClosing] = useState(false)
    const [dragX, setDragX] = useState(0)
    const [isDragging, setIsDragging] = useState(false)

    const dialogRef = useRef(null)
    const previouslyFocused = useRef(null)
    const dragStartX = useRef(null)
    const panelWidth = useRef(1)

    // === FIX: simpan onClose terbaru di ref, supaya focus-trap effect
    // di bawah tidak perlu "onClose" sebagai dependency.
    // Tanpa ini, setiap kali parent re-render (misal user mengetik di form),
    // fungsi onClose dibuat ulang (reference baru) -> effect dianggap berubah
    // -> cleanup + effect jalan lagi -> fokus "direbut" balik ke elemen
    // pertama di modal setiap keystroke.
    const onCloseRef = useRef(onClose)
    useEffect(() => {
        onCloseRef.current = onClose
    }, [onClose])

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true)
            setIsClosing(false)
            setDragX(0)
        } else if (shouldRender) {
            setIsClosing(true)
            const timer = setTimeout(() => setShouldRender(false), 220)
            return () => clearTimeout(timer)
        }
    }, [isOpen, shouldRender])

    useEffect(() => {
        if (!shouldRender) return
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [shouldRender])

    useEffect(() => {
        if (!shouldRender) return

        previouslyFocused.current = document.activeElement
        const dialog = dialogRef.current
        panelWidth.current = dialog?.offsetWidth || 1

        const focusable = dialog?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        focusable?.[0]?.focus()

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && closeOnEscape) {
                // === FIX: pakai ref, bukan onClose langsung, supaya
                // listener ini tidak perlu di-attach ulang tiap render.
                onCloseRef.current?.()
                return
            }

            if (e.key !== 'Tab' || !focusable?.length) return

            const first = focusable[0]
            const last = focusable[focusable.length - 1]

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            previouslyFocused.current?.focus?.()
        }
        // === FIX: "onClose" dihapus dari dependency array.
        // Effect ini sekarang HANYA jalan saat modal benar-benar
        // dibuka/ditutup (shouldRender berubah) atau closeOnEscape berubah,
        // bukan setiap kali parent re-render karena state form berubah.
    }, [shouldRender, closeOnEscape])

    // ---------- Drag-to-close (mouse & touch) ----------
    const handleDragStart = (clientX) => {
        dragStartX.current = clientX
        setIsDragging(true)
    }

    const handleDragMove = (clientX) => {
        if (dragStartX.current === null) return
        const delta = clientX - dragStartX.current
        setDragX(Math.max(0, delta))
    }

    const handleDragEnd = () => {
        if (dragStartX.current === null) return
        dragStartX.current = null
        setIsDragging(false)

        if (dragX > DRAG_CLOSE_THRESHOLD) {
            onCloseRef.current?.()
        }
        setDragX(0)
    }

    const onHandleMouseDown = (e) => {
        handleDragStart(e.clientX)

        const onMouseMove = (ev) => handleDragMove(ev.clientX)
        const onMouseUp = () => {
            handleDragEnd()
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }

    const onHandleTouchStart = (e) => {
        handleDragStart(e.touches[0].clientX)
    }

    const onHandleTouchMove = (e) => {
        handleDragMove(e.touches[0].clientX)
    }

    if (!shouldRender) return null

    const handleOverlayClick = (e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose?.()
        }
    }

    const dragProgress = Math.min(dragX / panelWidth.current, 1)
    const panelStyle = isDragging
        ? {
            transform: `translateX(${dragX}px)`,
            transition: 'none',
        }
        : undefined
    const overlayStyle = isDragging
        ? { opacity: 1 - dragProgress * 0.7 }
        : undefined

    return (
        <div
            className={`modal-overlay ${isClosing ? 'is-closing' : ''}`}
            style={overlayStyle}
            onMouseDown={handleOverlayClick}
        >
            <div
                ref={dialogRef}
                className={`modal-drawer modal-${size} modal-tone-${tone} ${isClosing ? 'is-closing' : ''} ${isDragging ? 'is-dragging' : ''}`}
                style={panelStyle}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                onMouseMove={isDragging ? (e) => handleDragMove(e.clientX) : undefined}
                onMouseUp={isDragging ? handleDragEnd : undefined}
                onTouchMove={isDragging ? onHandleTouchMove : undefined}
                onTouchEnd={isDragging ? handleDragEnd : undefined}
            >
                <div
                    className="modal-drag-handle"
                    onMouseDown={onHandleMouseDown}
                    onTouchStart={onHandleTouchStart}
                    aria-hidden="true"
                >
                    <span className="modal-drag-grip" />
                </div>

                <div className="modal-header">
                    <div className="modal-header-title">
                        {ICONS[tone] && (
                            <span className={`modal-icon modal-icon-${tone}`} aria-hidden="true">
                                {ICONS[tone]}
                            </span>
                        )}
                        <h3 id="modal-title">{title}</h3>
                    </div>

                    <button type="button" className="modal-close" onClick={onClose} aria-label="Tutup">
                        ×
                    </button>
                </div>

                <div className="modal-body">{children}</div>

                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    )
}