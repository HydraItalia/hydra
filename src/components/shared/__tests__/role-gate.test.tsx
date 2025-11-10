import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RoleGate } from '../role-gate'

describe('RoleGate', () => {
  it('should render children when user role is allowed', () => {
    render(
      <RoleGate allowedRoles={['ADMIN', 'AGENT']} userRole="ADMIN">
        <div>Admin Content</div>
      </RoleGate>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('should render children when user role matches one of allowed roles', () => {
    render(
      <RoleGate allowedRoles={['ADMIN', 'AGENT', 'VENDOR']} userRole="AGENT">
        <div>Agent Content</div>
      </RoleGate>
    )

    expect(screen.getByText('Agent Content')).toBeInTheDocument()
  })

  it('should not render children when user role is not allowed', () => {
    render(
      <RoleGate allowedRoles={['ADMIN']} userRole="CLIENT">
        <div>Admin Only Content</div>
      </RoleGate>
    )

    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument()
  })

  it('should render fallback when user role is not allowed', () => {
    render(
      <RoleGate
        allowedRoles={['ADMIN']}
        userRole="CLIENT"
        fallback={<div>Access Denied</div>}
      >
        <div>Admin Only Content</div>
      </RoleGate>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument()
  })

  it('should handle single allowed role', () => {
    render(
      <RoleGate allowedRoles={['VENDOR']} userRole="VENDOR">
        <div>Vendor Content</div>
      </RoleGate>
    )

    expect(screen.getByText('Vendor Content')).toBeInTheDocument()
  })

  it('should handle all roles', () => {
    const AllowedForClient = () => (
      <RoleGate allowedRoles={['CLIENT']} userRole="CLIENT">
        <div>Client Content</div>
      </RoleGate>
    )

    const { rerender } = render(<AllowedForClient />)
    expect(screen.getByText('Client Content')).toBeInTheDocument()

    rerender(
      <RoleGate allowedRoles={['CLIENT']} userRole="ADMIN">
        <div>Client Content</div>
      </RoleGate>
    )
    expect(screen.queryByText('Client Content')).not.toBeInTheDocument()
  })

  it('should render null by default when not allowed', () => {
    const { container } = render(
      <RoleGate allowedRoles={['ADMIN']} userRole="CLIENT">
        <div>Content</div>
      </RoleGate>
    )

    expect(container.textContent).toBe('')
  })
})
