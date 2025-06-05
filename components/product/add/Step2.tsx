import React, { useRef, useState, useEffect } from "react";
import { Info, Upload, Eye } from "lucide-react";

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
    isViewMode?: boolean; // 읽기전용 모드 prop 추가
}

export default function Step2({
    formData,
    handleChange,
    handlePrevStep,
    handleSubmit,
    handleProductImageChange,
    handleProductManualChange,
    isModify,
    isViewMode = false, // 기본값 false
}: Step2Props) {
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const guideInputRef = useRef<HTMLInputElement | null>(null);

    const [localPreviewImage, setLocalPreviewImage] = useState<string>(formData.imageUrl);
    const [localPreviewGuide, setLocalPreviewGuide] = useState<string>(formData.guideFileUrl);

    // 이미지 파일 변경 핸들러
    const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isViewMode) return; // 읽기전용 모드에서는 파일 변경 불가
        
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setLocalPreviewImage(previewUrl);
            handleProductImageChange(e);
        }
    };

    // 안내서 파일 변경 핸들러
    const onGuideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isViewMode) return; // 읽기전용 모드에서는 파일 변경 불가
        
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const previewUrl = URL.createObjectURL(file);
            setLocalPreviewGuide(previewUrl);
            handleProductManualChange(e);
        }
    };

    // 읽기전용 모드용 파일 업로드 영역 클릭 핸들러
    const handleUploadAreaClick = (inputRef: React.RefObject<HTMLInputElement | null>) => {
        if (!isViewMode) {
            inputRef.current?.click();
        }
    };

    useEffect(() => {
        setLocalPreviewImage(formData.imageUrl);
        setLocalPreviewGuide(formData.guideFileUrl);
    }, [formData.imageUrl, formData.guideFileUrl]);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold text-gray-700 mb-6 text-center">
                상세 내용 {isViewMode && "(읽기전용)"}
            </h2>
            
            <form onSubmit={handleSubmit}>
                {/* 상세 설명 */}
                <div className="mb-6">
                    <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                        <Info size={16} className="mr-2 text-pink-500" />
                        상품 상세 설명
                    </label>
                    <textarea
                        name="description"
                        placeholder={isViewMode ? "상품 설명이 없습니다" : "상품에 대한 상세 설명을 입력해주세요."}
                        value={formData.description}
                        onChange={handleChange}
                        disabled={isViewMode}
                        className={`w-full p-3 border-none rounded-lg h-48 focus:ring-2 focus:ring-pink-200 focus:outline-none transition-all ${
                            isViewMode 
                                ? 'bg-gray-100 cursor-not-allowed text-gray-600' 
                                : 'bg-gray-50 text-gray-700'
                        }`}
                    />
                </div>

                {/* 상품 CI 이미지 업로드 */}
                <div className="mb-6">
                    <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                        {isViewMode ? (
                            <Eye size={16} className="mr-2 text-pink-500" />
                        ) : (
                            <Upload size={16} className="mr-2 text-pink-500" />
                        )}
                        상품 CI 이미지 {isViewMode ? "조회" : "업로드"}
                    </label>
                    
                    {!isViewMode && (
                        <>
                            {/* 파일 input 숨기고 ref 연결 */}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onImageChange}
                                ref={imageInputRef}
                                style={{ display: "none" }}
                            />
                            {/* 클릭시 input 클릭 트리거, 내부 텍스트 중앙 정렬 */}
                            <div
                                className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex items-center justify-center text-gray-500 text-sm cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition-colors"
                                onClick={() => handleUploadAreaClick(imageInputRef)}
                            >
                                이미지 파일을 선택해 주세요 (PNG, JPG, JPEG)
                            </div>
                        </>
                    )}
                    
                    {isViewMode && !localPreviewImage && (
                        <div className="border-2 border-gray-200 rounded-lg p-6 flex items-center justify-center text-gray-400 text-sm">
                            업로드된 이미지가 없습니다
                        </div>
                    )}
                </div>

                {/* 이미지 미리보기 */}
                {localPreviewImage && (
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">
                            상품 이미지 {isViewMode ? "조회" : "미리보기"}
                        </p>
                        <div className="relative inline-block">
                            <img
                                src={localPreviewImage}
                                alt="상품 이미지"
                                className="w-48 h-auto rounded-md border border-gray-300 shadow-sm"
                            />
                            {isViewMode && (
                                <div className="absolute top-2 right-2">
                                    <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                                        읽기전용
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 안내서 PDF 업로드 */}
                <div className="mb-6">
                    <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                        {isViewMode ? (
                            <Eye size={16} className="mr-2 text-pink-500" />
                        ) : (
                            <Upload size={16} className="mr-2 text-pink-500" />
                        )}
                        상품 안내서 {isViewMode ? "조회" : "업로드"}
                    </label>
                    
                    {!isViewMode && (
                        <>
                            {/* 파일 input 숨기기 */}
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.hwp"
                                onChange={onGuideChange}
                                ref={guideInputRef}
                                style={{ display: "none" }}
                            />
                            {/* 안내서 영역 클릭 시 파일 선택 창 트리거 */}
                            <div
                                className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex items-center justify-center text-gray-500 text-sm cursor-pointer hover:border-pink-300 hover:bg-pink-50 transition-colors"
                                onClick={() => handleUploadAreaClick(guideInputRef)}
                            >
                                안내서 파일을 선택해 주세요 (PDF, DOCX, HWP)
                            </div>
                        </>
                    )}
                    
                    {isViewMode && !localPreviewGuide && (
                        <div className="border-2 border-gray-200 rounded-lg p-6 flex items-center justify-center text-gray-400 text-sm">
                            업로드된 안내서가 없습니다
                        </div>
                    )}
                </div>

                {/* 안내서 PDF 미리보기 (링크 또는 파일명 표시) */}
                {localPreviewGuide && (
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">
                            안내서 {isViewMode ? "조회" : "미리보기"}
                        </p>
                        <div className="flex items-center space-x-2">
                            <a
                                href={localPreviewGuide}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                            >
                                <Eye size={16} className="mr-2" />
                                안내서 보기
                            </a>
                            {isViewMode && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    읽기전용
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* 하단 버튼 */}
                <div className="mt-8 flex gap-3">
                    <button
                        type="button"
                        onClick={handlePrevStep}
                        className="flex-1 p-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        이전
                    </button>
                    
                    {isViewMode ? (
                        // 읽기전용 모드: 목록으로 버튼
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="flex-1 p-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                        >
                            목록으로
                        </button>
                    ) : isModify ? (
                        // 수정 모드: 제출 버튼
                        <button
                            type="submit"
                            className="flex-1 p-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                        >
                            수정 완료
                        </button>
                    ) : (
                        // 추가 모드: 제출 버튼
                        <button
                            type="submit"
                            className="flex-1 p-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                        >
                            요청하기
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}