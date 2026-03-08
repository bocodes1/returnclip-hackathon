import Foundation
import UIKit

/// Calls the local hackcanada-model ML service for sofa condition classification.
/// This service is used for testing/validating the model's quality against the Gemini results.
class ModelEvaluationService {
    static let shared = ModelEvaluationService()

    /// Base URL for the hackcanada-model Flask API (defaults to localhost:5001)
    /// Override this to point to a different host/port if needed
    var baseUrl: String = "http://localhost:5001"

    /// Whether the model service is reachable (cached for quick checks)
    private(set) var isReachable: Bool = false

    private init() {
        Task { self.isReachable = await checkHealth() }
    }

    // MARK: - Health Check

    /// Check if the model service is reachable
    func checkHealth() async -> Bool {
        guard let url = URL(string: "\(baseUrl)/api/health") else { return false }
        do {
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.timeoutInterval = 5
            let (_, response) = try await URLSession.shared.data(for: request)
            let isHealthy = (response as? HTTPURLResponse)?.statusCode == 200
            await MainActor.run { self.isReachable = isHealthy }
            return isHealthy
        } catch {
            await MainActor.run { self.isReachable = false }
            return false
        }
    }

    // MARK: - Image Classification

    /// Upload and classify an image using the ML model.
    /// - Parameter imageData: JPG/PNG image data
    /// - Returns: ModelAssessment with condition class, confidence, and damage types
    func classifyImage(_ imageData: Data) async throws -> ModelAssessment {
        guard let url = URL(string: "\(baseUrl)/api/classify") else {
            throw ModelError.invalidUrl
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 30

        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        // Build multipart form data
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"photo.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw ModelError.classificationFailed
        }

        return try JSONDecoder().decode(ModelAssessment.self, from: data)
    }

    /// Classify multiple images in sequence.
    func classifyImages(_ imageDatas: [Data]) async throws -> [ModelAssessment] {
        var assessments: [ModelAssessment] = []
        for imageData in imageDatas {
            let assessment = try await classifyImage(imageData)
            assessments.append(assessment)
        }
        return assessments
    }

    // MARK: - Demo Cases

    /// Get a pre-loaded demo result for testing without training a model.
    /// - Parameter caseId: One of "clean_sofa", "light_damage_sofa", "heavy_damage_sofa", "not_a_sofa"
    func getDemoCase(_ caseId: String) async throws -> ModelAssessment {
        guard let url = URL(string: "\(baseUrl)/api/demo/\(caseId)") else {
            throw ModelError.invalidUrl
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 10

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw ModelError.classificationFailed
        }

        return try JSONDecoder().decode(ModelAssessment.self, from: data)
    }

    /// List available demo cases.
    func listDemoCases() async throws -> [String] {
        guard let url = URL(string: "\(baseUrl)/api/demo-cases") else {
            throw ModelError.invalidUrl
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 10

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw ModelError.classificationFailed
        }

        let decoded = try JSONDecoder().decode(DemoCasesResponse.self, from: data)
        return decoded.cases
    }
}
