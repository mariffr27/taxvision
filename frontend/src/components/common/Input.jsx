import React, { useState, useRef, useCallback } from 'react'
import './Input.css'

export default function Input({
    // Core props
    label,
    type = 'text',
    name,
    value,
    placeholder = '',
    onChange,
    onBlur,
    onFocus,
    error = '',
    help = '',
    success = false,
    disabled = false,
    required = false,
    readOnly = false,
    className = '',
    id,

    // Layout props
    prefix = null,
    suffix = null,
    size = 'medium', // small, medium, large
    fullWidth = true,
    inline = false,
    labelPosition = 'top', // top, left

    // Password toggle
    showPasswordToggle = false,

    // Clear button
    clearable = false,
    onClear,

    // Counter
    showCounter = false,
    maxLength,

    // Validation
    validateOnBlur = false,
    customValidator,
    debounceDelay = 300,

    // Accessibility
    ariaLabel,
    ariaDescribedBy,

    ...rest
}) {
    const [localValue, setLocalValue] = useState(value || '')
    const [isFocused, setIsFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [validationError, setValidationError] = useState('')
    const inputRef = useRef(null)
    const debounceTimer = useRef(null)

    const hasError = Boolean(error || validationError)
    const displayError = error || validationError
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type
    const inputId = id || name

    // Handle value changes
    const handleChange = useCallback((e) => {
        const newValue = e.target.value
        setLocalValue(newValue)

        // Clear validation error on change
        if (validationError) setValidationError('')

        // Debounce for custom validation
        if (customValidator && validateOnBlur) {
            clearTimeout(debounceTimer.current)
            debounceTimer.current = setTimeout(() => {
                const result = customValidator(newValue)
                if (typeof result === 'string') {
                    setValidationError(result)
                } else if (result === false) {
                    setValidationError('Invalid value')
                } else {
                    setValidationError('')
                }
            }, debounceDelay)
        }

        if (onChange) onChange(e)
    }, [onChange, customValidator, validateOnBlur, debounceDelay, validationError])

    // Handle blur
    const handleBlur = useCallback((e) => {
        setIsFocused(false)

        // Validate on blur
        if (customValidator && !validateOnBlur) {
            const result = customValidator(e.target.value)
            if (typeof result === 'string') {
                setValidationError(result)
            } else if (result === false) {
                setValidationError('Invalid value')
            } else {
                setValidationError('')
            }
        }

        if (onBlur) onBlur(e)
    }, [onBlur, customValidator, validateOnBlur])

    const handleFocus = useCallback((e) => {
        setIsFocused(true)
        if (onFocus) onFocus(e)
    }, [onFocus])

    // Handle clear
    const handleClear = useCallback(() => {
        setLocalValue('')
        setValidationError('')
        if (onClear) onClear()
        if (onChange) {
            const event = { target: { value: '' } }
            onChange(event)
        }
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [onClear, onChange])

    // Toggle password visibility
    const togglePassword = useCallback(() => {
        setShowPassword(prev => !prev)
    }, [])

    // Get current value
    const currentValue = value !== undefined ? value : localValue

    // Message ID for accessibility
    const messageId = displayError || help ? `${inputId}-message` : undefined

    // Size classes
    const sizeClasses = {
        small: 'input-size-small',
        medium: 'input-size-medium',
        large: 'input-size-large'
    }

    // Label position
    const labelClasses = {
        top: 'input-label-top',
        left: 'input-label-left'
    }

    return (
        <div
            className={[
                'input-group',
                sizeClasses[size],
                labelClasses[labelPosition],
                fullWidth ? 'input-full-width' : 'input-inline',
                inline ? 'input-inline-mode' : '',
                className
            ].filter(Boolean).join(' ')}
        >
            {label && (
                <label
                    className="input-label"
                    htmlFor={inputId}
                >
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}

            <div className="input-wrapper">
                <div
                    className={[
                        'input-field-wrap',
                        hasError ? 'has-error' : '',
                        success && !hasError ? 'has-success' : '',
                        disabled ? 'is-disabled' : '',
                        readOnly ? 'is-readonly' : '',
                        isFocused ? 'is-focused' : '',
                        currentValue ? 'has-value' : '',
                    ].filter(Boolean).join(' ')}
                >
                    {prefix && <span className="input-prefix">{prefix}</span>}

                    <input
                        ref={inputRef}
                        id={inputId}
                        type={inputType}
                        name={name}
                        value={currentValue}
                        placeholder={placeholder}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={handleFocus}
                        disabled={disabled}
                        readOnly={readOnly}
                        required={required}
                        maxLength={maxLength}
                        className="input-field"
                        aria-label={ariaLabel || label}
                        aria-invalid={hasError || undefined}
                        aria-describedby={displayError || help ? messageId : ariaDescribedBy}
                        aria-required={required || undefined}
                        {...rest}
                    />

                    {clearable && currentValue && !disabled && !readOnly && (
                        <button
                            type="button"
                            className="input-clear-btn"
                            onClick={handleClear}
                            aria-label="Clear input"
                            tabIndex={-1}
                        >
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}

                    {isPassword && showPasswordToggle && (
                        <button
                            type="button"
                            className="input-password-toggle"
                            onClick={togglePassword}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 012.232-3.396m3.107-3.107A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.05 10.05 0 01-2.232 3.396M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                                </svg>
                            )}
                        </button>
                    )}

                    {suffix && <span className="input-suffix">{suffix}</span>}
                </div>

                {showCounter && maxLength && (
                    <span className="input-counter">
                        {String(currentValue).length}/{maxLength}
                    </span>
                )}
            </div>

            {(displayError || help) && (
                <div className="input-messages">
                    {displayError ? (
                        <small id={messageId} className="input-message input-message-error">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="input-message-icon">
                                <circle cx="10" cy="10" r="8" strokeWidth="2" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6v4m0 4h.01" />
                            </svg>
                            {displayError}
                        </small>
                    ) : help ? (
                        <small id={messageId} className="input-message input-message-help">
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="input-message-icon">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {help}
                        </small>
                    ) : null}
                </div>
            )}
        </div>
    )
}