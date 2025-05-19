const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// 임시로 토큰을 직접 선언, 실제로는 로그인 성공 시 세팅하거나 안전하게 저장해주세요
const token = "eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiQkFOSyIsImVtYWlsIjoid29vcmlAd29vcmkuY29tIiwic3ViIjoid29vcmlAd29vcmkuY29tIiwiaWF0IjoxNzQ3NjE5ODUzLCJleHAiOjE3NDc2MjM0NTN9.5yNNhPqqQXzxH3lXFjH-gqH9piETdHdNur53wtMSGVgJ30c50NTd2HSUbBp9MCE0";

export async function fetchBankAccounts() {
  const response = await fetch(`${BASE_URL}/bank/account/all`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch accounts');
  }
  return response.json();
}