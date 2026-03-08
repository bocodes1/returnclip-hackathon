import Foundation

/// Gemini policy reasoning — now handled server-side via BackendService.
/// The backend calls Gemini Vision directly with the Cloudinary image URLs,
/// returning both ConditionAssessment and RefundDecision in one shot.
///
/// This file is kept for reference only. The live path is:
/// ReturnClipExperience → BackendService.analyzeReturn() → backend/routes/analyze.js → Gemini API
class GeminiService {
    static let shared = GeminiService()
    private init() {}
}

// MARK: - Shared Gemini request/response models (used by BackendService decoder)

struct GeminiRequest: Codable {
    let contents: [GeminiContent]
    let generationConfig: GenerationConfig
}

struct GeminiContent: Codable {
    let parts: [GeminiPart]
}

struct GeminiPart: Codable {
    let text: String
}

struct GenerationConfig: Codable {
    let responseMimeType: String
    let temperature: Double
}

struct GeminiResponse: Codable {
    let candidates: [GeminiCandidate]
}

struct GeminiCandidate: Codable {
    let content: GeminiContent
}

enum GeminiError: Error, LocalizedError {
    case requestFailed
    case invalidResponse
    case quotaExceeded

    var errorDescription: String? {
        switch self {
        case .requestFailed: return "Failed to process request"
        case .invalidResponse: return "Invalid response from AI"
        case .quotaExceeded: return "API quota exceeded"
        }
    }
}
