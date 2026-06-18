"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export function LoginForm({ redirectTo, title }: { redirectTo: string; title: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isSupabaseConfigured) {
      setError("서버가 아직 Supabase에 연결되지 않았습니다. (.env.local 설정 필요)")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError("로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.")
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <h1 className="text-xl font-bold">{title}</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email" required placeholder="이메일" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
        />
        <input
          type="password" required placeholder="비밀번호" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
        />
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-300"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </main>
  )
}
