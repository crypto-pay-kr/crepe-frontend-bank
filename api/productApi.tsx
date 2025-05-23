import { getAccessToken } from "@/context/AuthContext";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
import { RegisterProductRequest } from "@/types/Product";


export async function registerProduct(
    requestData: RegisterProductRequest,
    productImage: File,
    guideFile?: File
) {
    try {
        const formData = new FormData();
        // 이미지 파일
        formData.append("productImage", productImage);
        // 안내서 파일 (있을 경우)
        if (guideFile) {
            formData.append("guideFile", guideFile);
        }
        // JSON 형태의 요청 DTO
        formData.append("request", JSON.stringify(requestData));

        const accessToken = getAccessToken();
        if (!accessToken) {
            throw new Error("Access token is missing");
        }

        const response = await fetch(`${BASE_URL}/bank/register/product`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Failed to register product");
        }

        // 서버가 JSON이 아닌 메시지 문자열로 응답할 가능성 대비
        const resultText = await response.text();
        try {
            return JSON.parse(resultText);
        } catch (e) {
            return { message: resultText };
        }
    } catch (error) {
        console.error("Error registering product:", error);
        throw error;
    }
}

export async function getProducts() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new Error("Access token is missing");
    }
    const response = await fetch(`${BASE_URL}/bank/products`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error("상품 조회에 실패했습니다.");
    }
    return response.json();
}

export async function getProductById(id: number): Promise<FormData> {
    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new Error("Access token is missing");
    }

    const response = await fetch(`${BASE_URL}/bank/product/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error(`상품 조회에 실패했습니다. status: ${response.status}`);
    }
    return response.json();
}

export async function getSuspendedProducts() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new Error("Access token is missing");
    }
    const response = await fetch(`${BASE_URL}/bank/products/suspended`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error("판매중지 상품 조회에 실패했습니다.");
    }
    return response.json();
}