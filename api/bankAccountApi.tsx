import { getAccessToken } from "@/context/AuthContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL+"/api";


export async function fetchBankAccounts() {

  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }
  const response = await fetch(`${BASE_URL}/bank/account/all`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }
  return response.json();
}

export async function registerBankAccount(bankName: string, currency: string, address: string, tag?: string): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const response = await fetch(`${BASE_URL}/bank/register/account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      bankName,
      getAddressRequest: {
        currency,
        address,
        tag,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to register bank account");
  }
}

export async function getAccountByCurrency(currency: string): Promise<{
  bankName: string;
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

  const response = await fetch(`${BASE_URL}/bank/account?currency=${currency}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch account details");
  }

  return response.json();
}

export async function changeBankAccount(
  depositorName: string,
  currency: string,
  address: string,
  tag: string
): Promise<void> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error("Access token is missing")
  }

  const response = await fetch(`${BASE_URL}/bank/change/account`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      bankName: depositorName,
      getAddressRequest: {
        currency,
        address,
        tag,
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || "Failed to update bank account")
  }
}