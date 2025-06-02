import { getAccessToken } from "@/context/AuthContext";
import { ApiError } from "@/app/error/ApiError";
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;
import { RegisterProductRequest } from "@/types/Product";


export async function registerProduct(
    requestData: RegisterProductRequest,
    productImage: File,
    guideFile?: File
) {
    try {
        const formData = new FormData();

        formData.append("productImage", productImage);
        if (guideFile) {
            formData.append("guideFile", guideFile);
        }
        formData.append("request", JSON.stringify(requestData));

        const accessToken = getAccessToken();
        if (!accessToken) {
            throw new Error("Access token is missing");
        }

        const response = await fetch(`${API_BASE_URL}/bank/register/product`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
                errorData.code || "UNKNOWN",
                response.status,
                errorData.message || "상품 등록에 실패했습니다."
            );
        }

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
    const response = await fetch(`${API_BASE_URL}/bank/products`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.code || "UNKNOWN",
            response.status,
            errorData.message || "상품 조회에 실패했습니다."
        );
    }
    return response.json();
}

export async function getProductById(id: number): Promise<FormData> {
    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new Error("Access token is missing");
    }

    const response = await fetch(`${API_BASE_URL}/bank/products/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.code || "UNKNOWN",
            response.status,
            errorData.message || `상품 조회에 실패했습니다. status: ${response.status}`
        );
    }
    return response.json();
}

export async function getSuspendedProducts() {
    const accessToken = getAccessToken();
    if (!accessToken) {
        throw new Error("Access token is missing");
    }
    const response = await fetch(`${API_BASE_URL}/bank/products/suspended`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            errorData.code || "UNKNOWN",
            response.status,
            errorData.message || "판매중지 상품 조회에 실패했습니다."
        );
    }
    return response.json();
}


/** 모든 태그 조회 */
export async function getAllTags(): Promise<string[]> {
    const accessToken = getAccessToken();
    if (!accessToken) throw new Error("Access token is missing");
    const response = await fetch(`${API_BASE_URL}/bank/products/tags`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.code || "UNKNOWN",
          response.status,
          errorData.message || "태그 조회에 실패했습니다."
        );
      }
    
    return response.json();
}