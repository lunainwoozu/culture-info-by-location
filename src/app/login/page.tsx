"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";

const USERS_KEY = "registered_users";

const loginSchema = z.object({
  email: z.email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력해 주세요"),
});

type FormErrors = Partial<Record<"email" | "password" | "root", string>>;

interface StoredUser {
  email: string;
  password: string;
}

function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const users = getUsers();
    const matched = users.find(
      (u) => u.email === email && u.password === password,
    );
    if (!matched) {
      setErrors({ root: "이메일 또는 비밀번호가 올바르지 않습니다" });
      return;
    }

    login(email);
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">로그인</h1>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              placeholder="비밀번호 입력"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          {errors.root && <p className="text-sm text-red-500">{errors.root}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-teal-500 py-2 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
          >
            로그인
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          계정이 없으신가요?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="font-medium text-teal-600 hover:underline"
          >
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
}
