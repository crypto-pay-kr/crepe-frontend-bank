const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const token = "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiQkFOSyIsImVtYWlsIjoid29vcmlAd29vcmkuY29tIiwic3ViIjoid29vcmlAd29vcmkuY29tIiwiaWF0IjoxNzQ3NjE5ODUzLCJleHAiOjE3NDc2MjM0NTN9.5yNNhPqqQXzxH3lXFjH-gqH9piETdHdNur53wtMSGVgJ30c50NTd2HSUbBp9MCE0";
  

export async function fetchBankInfoDetail() {
  const response = await fetch(`${BASE_URL}/bank`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch bank info detail");
  }
  return response.json();
}

export async function changeBankPhone(phoneNumber: string) {
    const response = await fetch(`${BASE_URL}/bank/change/phone`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bankPhoneNumber: phoneNumber }),
    });
    if (!response.ok) {
      throw new Error("Failed to change phone number");
    }
    return response.text(); // 예: "담당자 연결 번호 변경 성공"
  }