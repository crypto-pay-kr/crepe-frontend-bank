const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;
import { toast } from "react-toastify";

export interface BankLoginRequest {
  email: string;
  password: string;
  captchaKey: string;
  captchaValue: string;
}


export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
}


export async function BankLogin(body: BankLoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/bank/login`, {
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
  } catch (err: any) {
    toast.error(err.message);
    throw err;
  }
}