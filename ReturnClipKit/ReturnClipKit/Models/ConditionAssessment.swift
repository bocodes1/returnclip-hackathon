import Foundation

/// Result of AI condition analysis from Cloudinary + Gemini
struct ConditionAssessment: Codable {
    let overallQualityScore: Int  // 0-100, higher = better condition
    let categoryScores: [CategoryScore]
    let issues: [DetectedIssue]
    let confidence: Double  // 0-1
    let analysisTimestamp: Date
    
    var qualityLevel: QualityLevel {
        switch overallQualityScore {
        case 90...100: return .excellent
        case 75..<90: return .good
        case 50..<75: return .fair
        case 25..<50: return .poor
        default: return .unacceptable
        }
    }
}

struct CategoryScore: Codable {
    let category: ConditionCategory
    let score: Int  // 0-100
    let notes: String?
}

struct DetectedIssue: Codable, Identifiable {
    let id: String
    let category: ConditionCategory
    let severity: IssueSeverity
    let description: String
    let location: String?  // e.g., "top-left corner"
}

enum IssueSeverity: String, Codable {
    case minor
    case moderate
    case major
    case critical
    
    var color: String {
        switch self {
        case .minor: return "green"
        case .moderate: return "yellow"
        case .major: return "orange"
        case .critical: return "red"
        }
    }
}

enum QualityLevel: String {
    case excellent = "Excellent"
    case good = "Good"
    case fair = "Fair"
    case poor = "Poor"
    case unacceptable = "Unacceptable"
    
    var emoji: String {
        switch self {
        case .excellent: return "✅"
        case .good: return "👍"
        case .fair: return "⚠️"
        case .poor: return "⛔"
        case .unacceptable: return "❌"
        }
    }
    
    var color: String {
        switch self {
        case .excellent: return "green"
        case .good: return "blue"
        case .fair: return "yellow"
        case .poor: return "orange"
        case .unacceptable: return "red"
        }
    }
}

/// Gemini's refund decision based on condition + policy
struct RefundDecision: Codable {
    let decision: RefundType
    let refundAmount: Decimal
    let originalAmount: Decimal
    let restockingFee: Decimal?
    let explanation: String
    let policyViolations: [String]
    let alternativeOptions: [RefundOption]
}

enum RefundType: String, Codable {
    case fullRefund = "full_refund"
    case partialRefund = "partial_refund"
    case exchangeOnly = "exchange_only"
    case storeCreditOnly = "store_credit_only"
    case denied = "denied"
}

struct RefundOption: Codable, Identifiable {
    let id: String
    let type: RefundOptionType
    let amount: Decimal
    let bonusAmount: Decimal?
    let description: String
}

enum RefundOptionType: String, Codable {
    case refundToOriginal = "refund_to_original"
    case storeCredit = "store_credit"
    case exchange = "exchange"
    case partialRefund = "partial_refund"
}

// MARK: - ML Model Assessment Types

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
