import Foundation

// MARK: - Model Assessment Response

struct ModelAssessment: Codable {
    let sofaConditionAssessment: SofaConditionAssessment

    enum CodingKeys: String, CodingKey {
        case sofaConditionAssessment = "sofa_condition_assessment"
    }
}

struct SofaConditionAssessment: Codable {
    let imageId: String
    let primaryVerdict: PrimaryVerdict
    let damageAnalysis: DamageAnalysis
    let returnEligibility: ReturnEligibility
    let confidenceAndFlags: ConfidenceAndFlags
    let error: String?
    let classProabilities: [String: Double]?

    enum CodingKeys: String, CodingKey {
        case imageId = "image_id"
        case primaryVerdict = "primary_verdict"
        case damageAnalysis = "damage_analysis"
        case returnEligibility = "return_eligibility"
        case confidenceAndFlags = "confidence_and_flags"
        case error
        case classProabilities = "class_probabilities"
    }

    // Computed property for easier access
    var conditionClass: String {
        primaryVerdict.conditionClass
    }

    var confidence: Double {
        confidenceAndFlags.overallConfidence
    }

    var refundPercent: Int {
        Int(returnEligibility.estimatedRefundPercent)
    }
}

struct PrimaryVerdict: Codable {
    let conditionClass: String
    let confidence: Double
    let recommendation: String

    enum CodingKeys: String, CodingKey {
        case conditionClass = "condition_class"
        case confidence, recommendation
    }
}

struct DamageAnalysis: Codable {
    let damageTypesDetected: [String]
    let damageDescriptions: [DamageDescription]

    enum CodingKeys: String, CodingKey {
        case damageTypesDetected = "damage_types_detected"
        case damageDescriptions = "damage_descriptions"
    }
}

struct DamageDescription: Codable {
    let type: String
    let severity: String
    let affectedRegion: String

    enum CodingKeys: String, CodingKey {
        case type, severity
        case affectedRegion = "affected_region"
    }
}

struct ReturnEligibility: Codable {
    let returnable: Bool
    let refundRecommendation: String
    let estimatedRefundPercent: Double
    let reason: String

    enum CodingKeys: String, CodingKey {
        case returnable
        case refundRecommendation = "refund_recommendation"
        case estimatedRefundPercent = "estimated_refund_percent"
        case reason
    }
}

struct ConfidenceAndFlags: Codable {
    let overallConfidence: Double
    let requiresHumanReview: Bool
    let reviewReason: String

    enum CodingKeys: String, CodingKey {
        case overallConfidence = "overall_confidence"
        case requiresHumanReview = "requires_human_review"
        case reviewReason = "review_reason"
    }
}

struct DemoCasesResponse: Codable {
    let cases: [String]
}

// MARK: - Errors

enum ModelError: Error, LocalizedError {
    case invalidUrl
    case classificationFailed
    case invalidResponse
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidUrl:
            return "Invalid model service URL"
        case .classificationFailed:
            return "Model classification failed"
        case .invalidResponse:
            return "Invalid response from model service"
        case .decodingFailed:
            return "Could not parse model response"
        }
    }
}
