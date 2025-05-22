import React, { useRef } from "react";
import { Info, Upload } from "lucide-react";

interface Step2Props {
    formData: {
        description: string;
        imageUrl: string;
        guideFileUrl: string;
    };
    handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    handlePrevStep: () => void;
    handleSubmit: (e: React.FormEvent) => void;
    handleProductImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleProductManualChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isModify: boolean;
}

export default function Step2({
    formData,
    handleChange,
    handlePrevStep,
    handleSubmit,
    handleProductImageChange,
    handleProductManualChange,
    isModify,
}: Step2Props) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const guideInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="p-6">
            <form onSubmit={handleSubmit}>
                {/* 이미지 미리보기 */}
                {formData.imageUrl && (
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">기존 상품 이미지 미리보기</p>
                        <img
                            src={formData.imageUrl}
                            alt="상품 이미지"
                            className="w-48 h-auto rounded-md border border-gray-300"
                        />
                    </div>
                )}

                {/* 안내서 PDF 링크 */}
                {formData.guideFileUrl && (
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">기존 상품 안내서</p>
                        <a
                            href={formData.guideFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-600 hover:text-blue-800"
                        >
                            안내서 보기
                        </a>
                    </div>
                )}

                {/* 상세 설명 */}
                <div className="mb-6">
                    <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                        <Info size={16} className="mr-2 text-pink-500" />
                        상품 상세 설명
                    </label>
                    <textarea
                        name="description"
                        placeholder="상품에 대한 상세 설명을 입력해주세요."
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full p-3 bg-gray-50 border-none rounded-lg h-48 focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all"
                    />
                </div>

                {/* 상품 CI 이미지 업로드 */}
                <div className="mb-6">
                    <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                        <Upload size={16} className="mr-2 text-pink-500" />
                        상품 CI 이미지 업로드
                    </label>
                    {/* 파일 input 숨기고 ref 연결 */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageChange}
                        ref={imageInputRef}
                        style={{ display: "none" }}
                    />
                    {/* 클릭시 input 클릭 트리거, 내부 텍스트 중앙 정렬 */}
                    <div
                        className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex items-center justify-center text-gray-500 text-sm cursor-pointer"
                        onClick={() => imageInputRef.current?.click()}
                    >
                        이미지 파일을 선택해 주세요 (PNG, JPG, JPEG)
                    </div>
                </div>


                {/* 상품 안내서 업로드 */}
                <div className="mb-6">
                    <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                        <Upload size={16} className="mr-2 text-pink-500" />
                        상품 안내서 업로드
                    </label>
                    {/* 파일 input 숨기기 */}
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.hwp"
                        onChange={handleProductManualChange}
                        ref={guideInputRef}
                        style={{ display: "none" }}
                    />
                    {/* 안내서 영역 클릭 시 파일 선택 창 트리거 */}
                    <div
                        className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex items-center justify-center text-gray-500 text-sm cursor-pointer"
                        onClick={() => guideInputRef.current?.click()}
                    >
                        안내서 파일을 선택해 주세요 (PDF, DOCX, HWP)
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        type="button"
                        onClick={handlePrevStep}
                        className="flex-1 p-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        이전
                    </button>
                    <button
                        type="submit"
                        className="flex-1 p-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                        {isModify ? "수정하기" : "요청하기"}
                    </button>
                </div>
            </form>
        </div>
    );
}