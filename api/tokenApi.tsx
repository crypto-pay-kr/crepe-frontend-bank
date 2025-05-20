import { getAccessToken } from "@/context/AuthContext";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getTokenHistory(page = 0, size = 10) {

    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new Error("Access token is missing");
    }

    const response = await fetch(`${BASE_URL}/bank/token/history?page=${page}&size=${size}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error("Failed to fetch token history");
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
  
    const response = await fetch(`${BASE_URL}/bank/token/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestData),
    });
  
    if (!response.ok) {
      throw new Error("Failed to create bank token");
    }
  
    return response.json();
  }