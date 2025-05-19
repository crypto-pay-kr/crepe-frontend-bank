import { useAuthContext, getAccessToken } from "@/context/AuthContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;


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