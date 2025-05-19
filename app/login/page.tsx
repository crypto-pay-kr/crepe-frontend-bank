"use client";
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from "../../context/AuthContext";
import { BankLogin } from "../../api/authApi";
import Image from 'next/image';
import Link from 'next/link';

// 스타일 모듈 import 대신 인라인 스타일 및 Tailwind 사용
function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { login } = useAuthContext();
    const router = useRouter();


    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        try {
          setErrorMessage(null);
    
          // 로그인 API 호출
          await login(email, password);
        
          // 로그인 성공 시 대시보드로 이동
          router.push("/dashboard");
        } catch (error: any) {
            console.error("로그인 실패:", error.message);
            setErrorMessage(error.message);
        }
      };
    

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div className="text-center">
                <div className="flex justify-center">
                        <Image
                            src="/crepe-newlogo2.png"
                            alt="CREPE Logo"
                            width={96}
                            height={96}
                            className="rounded-xl shadow-md mb-4"
                        />
                    </div>
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900">CREPE 은행 관리자 시스템</h2>
                    <p className="mt-2 text-sm text-gray-600">안전한 관리자 접속을 위해 로그인해 주세요</p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {errorMessage && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{errorMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="rounded-md -space-y-px">
                        <div className="mb-5">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                아이디
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="text"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                                placeholder="아이디를 입력하세요"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                비밀번호
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                                placeholder="비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all duration-200 shadow-md"
                        >
                            로그인
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;