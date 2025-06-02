import { getAccessToken } from "@/context/AuthContext";
import { ApiError } from "@/app/error/ApiError";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;


export async function fetchBankAccounts() {

  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(`${API_BASE_URL}/bank/account/all`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.code || "UNKNOWN", response.status, body.message || "Failed to fetch accounts");
  }
  return response.json();
}

export async function registerBankAccount(managerName: string, currency: string, address: string, tag?: string): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const response = await fetch(`${API_BASE_URL}/bank/register/account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      managerName,
      getAddressRequest: {
        currency,
        address,
        tag,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.code || "UNKNOWN", response.status, body.message || "Failed to fetch accounts");
  }
}

export async function getAccountByCurrency(currency: string): Promise<{
  bankName: string;
  managerName: string;
  addressResponse: {
    currency: string;
    address: string;
    tag: string | null;
    status: string;
  };
}> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const response = await fetch(`${API_BASE_URL}/bank/account?currency=${currency}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.code || "UNKNOWN", response.status, body.message || "Failed to fetch account details");
  }

  return response.json();
}

export async function changeBankAccount(
  managerName: string,
  currency: string,
  address: string,
  tag: string
): Promise<void> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error("Access token is missing")
  }

  const response = await fetch(`${API_BASE_URL}/bank/change/account`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      managerName: managerName,
      getAddressRequest: {
        currency,
        address,
        tag,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.code || "UNKNOWN", response.status, body.message || "Failed to update bank account");
  }
}


export const getRemainingCoinBalance = async (): Promise<RemainingCoinBalanceResponse[]> => {
  const token = sessionStorage.getItem("accessToken");
  const response = await fetch(`${API_BASE_URL}/bank/coin/remaining`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.code || "UNKNOWN", response.status, body.message || "잔여 코인 조회 실패");
  }

  return response.json();
};

// 새로 추가할 타입 정의 (원하는 파일에 선언)
export interface RemainingCoinBalanceResponse {
  coinName: string;
  currency: string;
  publishedBalance: number;
  accountBalance: number;
  remainingBalance: number;
}