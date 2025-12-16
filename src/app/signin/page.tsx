'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadingButton, setLoadingButton] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  const isDev = process.env.NODE_ENV !== 'production' &&
                process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === '1'

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Show spinner for at least 500ms so users see feedback
      await Promise.all([
        signIn('email', {
          email,
          redirect: false,
          callbackUrl: '/dashboard',
        }),
        new Promise(resolve => setTimeout(resolve, 500))
      ])
      setEmailSent(true)
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDevLogin(userEmail: string, buttonId: string) {
    console.log('Login clicked:', buttonId)
    setIsLoading(true)
    setLoadingButton(buttonId)
    console.log('Loading state set:', { isLoading: true, loadingButton: buttonId })

    try {
      // Show spinner for at least 500ms so users see feedback
      await Promise.all([
        signIn('email', {
          email: userEmail,
          redirect: true,
          callbackUrl: '/dashboard',
        }),
        new Promise(resolve => setTimeout(resolve, 500))
      ])
    } catch (error) {
      console.error('Dev login error:', error)
      setIsLoading(false)
      setLoadingButton(null)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a magic link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Click the link in the email to sign in. The link will expire in 24 hours.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setEmailSent(false)
                setEmail('')
              }}
              className="w-full"
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to Hydra</CardTitle>
            <CardDescription>
              Enter your email to receive a magic link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Sending...' : 'Send magic link'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isDev && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-600">
            <CardHeader>
              <CardTitle className="text-sm">Dev Mode - Quick Login</CardTitle>
              <CardDescription className="text-xs">
                These shortcuts are only available in development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDevLogin('admin@hydra.local', 'admin')}
                  disabled={isLoading}
                >
                  {loadingButton === 'admin' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Admin'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDevLogin('andrea@hydra.local', 'agent')}
                  disabled={isLoading}
                >
                  {loadingButton === 'agent' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Agent (Andrea)'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDevLogin('vendor.freezco@hydra.local', 'vendor')}
                  disabled={isLoading}
                >
                  {loadingButton === 'vendor' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Vendor'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDevLogin('client.demo@hydra.local', 'client')}
                  disabled={isLoading}
                >
                  {loadingButton === 'client' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Client'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDevLogin('driver.marco@hydra.local', 'driver')}
                  disabled={isLoading}
                >
                  {loadingButton === 'driver' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Driver'
                  )}
                </Button>
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                Note: You&apos;ll still need to click the magic link in the console/email
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
