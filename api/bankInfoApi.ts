import { getAccessToken } from "@/context/AuthContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  

export async function fetchBankInfoDetail() {

    const accessToken = getAccessToken();
    if (!accessToken) {
      throw new Error("Access token is missing");
  }

  const response = await fetch(`${BASE_URL}/bank`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch bank info detail");
  }
  return response.json();
}

export async function changeBankPhone(phoneNumber: string) {
  
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
}


    const response = await fetch(`${BASE_URL}/bank/change/phone`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ bankPhoneNumber: phoneNumber }),
    });
    if (!response.ok) {
      throw new Error("Failed to change phone number");
    }
    return response.text(); // 예: "담당자 연결 번호 변경 성공"
  }