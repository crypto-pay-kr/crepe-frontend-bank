const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
}

export async function BankLogin(body: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/bank/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "로그인에 실패했습니다.");
  }

  return response.json();
}