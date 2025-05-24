import { getAccessToken } from "@/context/AuthContext";
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export async function getTokenHistory(page = 0, size = 10) {

  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const response = await fetch(`${API_BASE_URL}/bank/token/history?page=${page}&size=${size}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch token history");
  }
  return response.json();
}

export async function createBankToken(requestData: {
  tokenName: string;
  tokenCurrency: string;
  portfolioCoins: {
    coinName: string;
    amount: number;
    currency: string;
    currentPrice: number;
  }[];
}) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const response = await fetch(`${API_BASE_URL}/bank/token/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create bank token");
  }
  // 서버가 JSON이 아닌 메시지 문자열을 반환하는 경우 예외 처리
  const resultText = await response.text();
  try {
    return JSON.parse(resultText);
  } catch (e) {
    // JSON이 아닐 경우 그대로 메시지를 반환 (또는 필요한 로직 처리)
    return { message: resultText };
  }
}

export async function recreateBankToken(requestData: {
  tokenName: string;
  tokenCurrency: string;
  portfolioCoins: {
    coinName: string;
    amount: number;
    currency: string;
    currentPrice: number;
  }[];
}) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const response = await fetch(`${API_BASE_URL}/bank/token/recreate`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to recreate bank token");
  }

  // 서버가 JSON이 아닌 메시지 문자열을 반환하는 경우 예외 처리
  const resultText = await response.text();
  try {
    return JSON.parse(resultText);
  } catch (e) {
    // JSON이 아닐 경우 그대로 메시지를 반환 (또는 필요한 로직 처리)
    return { message: resultText };
  }
}