"use client"

import { useState, useEffect } from "react"
import SubHeader from "@/components/common/SubHeader"
import { getSuspendedProducts } from "@/api/productApi"
import { BankProductStatus, mapBankProductStatus, SuspendedProduct } from "@/types/Product"

export default function SuspendedProductsPage() {
    const [suspendedProducts, setSuspendedProducts] = useState<SuspendedProduct[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        async function fetchSuspendedProducts() {
            setIsLoading(true)
            try {
                const data = await getSuspendedProducts();
                setSuspendedProducts(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false)
            }
        }
        fetchSuspendedProducts()
    }, [])

    return (
        <div className="flex-1 h-screen p-8 overflow-auto bg-gray-50">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <SubHeader />
                <div className="p-6 border-b border-gray-100">

                </div>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <p className="p-4 text-center">로딩 중...</p>
                    ) : (
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="py-3 px-4 text-left font-medium text-gray-600">아이디</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-600">상품명</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-600">등록일</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-600">설명</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-600">예치금</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-600">상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suspendedProducts.map((product) => {
                                    const status = mapBankProductStatus(product.status as BankProductStatus);
                                    return (
                                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4 text-gray-800">{product.id}</td>
                                            <td className="py-3 px-4 text-gray-800">{product.productName}</td>
                                            <td className="py-3 px-4 text-gray-800">
                                                {product.createdAt || product.startDate || "-"}
                                            </td>
                                            <td className="py-3 px-4 text-gray-800 truncate">{product.rejectReason}</td>
                                            <td className="py-3 px-4 text-gray-800">
                                                {typeof product.budget === "number"
                                                    ? product.budget.toLocaleString("ko-KR", { style: "currency", currency: "KRW" })
                                                    : product.budget}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgClass} ${status.textClass}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}