import Foundation

/// API Keys for ReturnClip services
///
/// Fill in your real values to use live APIs.
/// The app falls back to mock data when API calls fail, so demo mode works out of the box.
///
/// Keys needed:
/// - Cloudinary: https://cloudinary.com (free tier)
/// - Gemini: https://ai.google.dev (free tier)
/// - Backend: run `cd backend && npm install && npm start` (defaults to localhost:3001)
enum APIKeys {
    static let cloudinaryCloudName = "dyrit94wr"
    static let cloudinaryUploadPreset = "returnclip_uploads"
    static let geminiApiKey = "demo_key"
    static let shopifyStoreDomain = "demo-store.myshopify.com"
    static let shopifyStorefrontToken = "demo_token"

    // Backend URL — use localhost for Simulator, deploy to Railway/Render for real device
    static let backendUrl = "http://localhost:3001"

    static var isConfigured: Bool {
        cloudinaryCloudName != "demo_cloud"
    }
}
