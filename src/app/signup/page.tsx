'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'

const USERS_KEY = 'registered_users'

const signupSchema = z.object({
  email: z.email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirm'],
})

type FormErrors = Partial<Record<'email' | 'password' | 'confirm' | 'root', string>>

interface StoredUser {
  email: string
  password: string
}

function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? (JSON.parse(raw) as StoredUser[]) : []
  } catch {
    return []
  }
}

export default function SignupPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const result = signupSchema.safeParse({ email, password, confirm })
    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    const users = getUsers()
    if (users.some((u) => u.email === email)) {
      setErrors({ root: '이미 사용 중인 이메일입니다' })
      return
    }

    users.push({ email, password })
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    login(email)
    router.push('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">회원가입</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="example@email.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="8자 이상"
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">비밀번호 확인</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="비밀번호 재입력"
            />
            {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
          </div>

          {errors.root && (
            <p className="text-sm text-red-500">{errors.root}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-teal-500 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
          >
            가입하기
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="font-medium text-teal-600 hover:underline"
          >
            로그인
          </button>
        </p>
      </div>
    </div>
  )
}
