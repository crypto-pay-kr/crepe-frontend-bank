import { getAccessToken } from "@/context/AuthContext";
import { ApiError } from "@/app/error/ApiError"; 

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;



export async function fetchBankInfoDetail() {

  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const response = await fetch(`${API_BASE_URL}/bank`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(errorData.code || "UNKNOWN", response.status, errorData.message || "Failed to fetch bank info detail");
  }
  return response.json();
}

export async function changeBankPhone(phoneNumber: string) {

  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }

  const response = await fetch(`${API_BASE_URL}/bank/change/phone`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ bankPhoneNumber: phoneNumber }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(errorData.code || "UNKNOWN", response.status, errorData.message || "Failed to change phone number");
  }
  return response.text();
}

export async function changeBankCI(ciImage: File) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("Access token is missing");
  }
  const formData = new FormData();
  formData.append("ciImage", ciImage);

  const response = await fetch(`${API_BASE_URL}/bank/change/ci`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(errorData.code || "UNKNOWN", response.status, errorData.message || "Failed to change bank CI image");
  }
  return response.text(); 
}