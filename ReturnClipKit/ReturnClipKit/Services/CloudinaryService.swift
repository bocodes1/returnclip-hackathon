import Foundation
import UIKit

/// Handles direct image upload to Cloudinary CDN.
/// Condition analysis is delegated to the backend (BackendService)
/// which signs the request and calls Cloudinary AI Vision + Gemini.
class CloudinaryService {
    static let shared = CloudinaryService()

    private let cloudName = APIKeys.cloudinaryCloudName
    private let uploadPreset = APIKeys.cloudinaryUploadPreset

    private var uploadUrl: String {
        "https://api.cloudinary.com/v1_1/\(cloudName)/image/upload"
    }

    private init() {}

    // MARK: - Upload Image

    /// Uploads an image directly to Cloudinary using an unsigned upload preset.
    /// Returns the secure CDN URL for the uploaded image.
    func uploadImage(_ imageData: Data, orderId: String? = nil) async throws -> CloudinaryUploadResult {
        var request = URLRequest(url: URL(string: uploadUrl)!)
        request.httpMethod = "POST"
        request.timeoutInterval = 60

        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()

        // Upload preset (required for unsigned uploads)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"upload_preset\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(uploadPreset)\r\n".data(using: .utf8)!)

        // Folder organization: returnclip/returns/{orderId}/
        if let orderId {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"folder\"\r\n\r\n".data(using: .utf8)!)
            body.append("returnclip/returns/\(orderId)\r\n".data(using: .utf8)!)
        }

        // Tags for organization and Cloudinary ML auto-tagging
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"tags\"\r\n\r\n".data(using: .utf8)!)
        body.append("returnclip,return-verification\r\n".data(using: .utf8)!)

        // Context metadata
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"context\"\r\n\r\n".data(using: .utf8)!)
        body.append("return_verification=true|analysis_type=condition\r\n".data(using: .utf8)!)

        // Image data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"return_photo.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw CloudinaryError.uploadFailed
        }

        return try JSONDecoder().decode(CloudinaryUploadResult.self, from: data)
    }

    // MARK: - Build Optimized URL

    /// Returns a Cloudinary URL with quality/format optimizations applied.
    /// e.g. original: .../image/upload/photo.jpg
    ///      enhanced: .../image/upload/q_auto,f_auto,e_improve/photo.jpg
    func enhancedUrl(from secureUrl: String) -> String {
        secureUrl.replacingOccurrences(
            of: "/image/upload/",
            with: "/image/upload/q_auto,f_auto,e_improve/"
        )
    }
}

// MARK: - Models

struct CloudinaryUploadResult: Codable {
    let publicId: String
    let secureUrl: String
    let format: String
    let width: Int
    let height: Int
    let bytes: Int
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case publicId = "public_id"
        case secureUrl = "secure_url"
        case format, width, height, bytes
        case createdAt = "created_at"
    }
}

enum CloudinaryError: Error, LocalizedError {
    case uploadFailed
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .uploadFailed: return "Failed to upload image to Cloudinary"
        case .invalidResponse: return "Invalid response from Cloudinary"
        }
    }
}
