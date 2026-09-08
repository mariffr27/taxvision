import React from 'react'
import './Button.css'

export default function Button({
    children,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    onClick,
    disabled = false,
    loading = false,
    fullWidth = false,
    iconLeft = null,
    iconRight = null,
    className = '',
    ...rest
}) {
    const isDisabled = disabled || loading

    return (
        <button
            type={type}
            className={[
                'btn',
                `btn-${variant}`,
                `btn-${size}`,
                fullWidth ? 'btn-full' : '',
                loading ? 'btn-loading' : '',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
            onClick={onClick}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            {...rest}
        >
            {loading && <span className="btn-spinner" aria-hidden="true" />}
            {!loading && iconLeft && <span className="btn-icon btn-icon-left">{iconLeft}</span>}
            <span className="btn-label">{children}</span>
            {!loading && iconRight && <span className="btn-icon btn-icon-right">{iconRight}</span>}
        </button>
    )
}