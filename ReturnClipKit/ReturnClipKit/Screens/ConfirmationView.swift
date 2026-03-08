import SwiftUI
import CoreImage.CIFilterBuiltins

/// Screen 6: Confirmation — branches based on which refund option was confirmed.
struct ConfirmationView: View {
    @ObservedObject var flowState: ReturnFlowState
    @State private var showSuccess = false
    @State private var showCelebration = false

    var body: some View {
        Group {
            switch flowState.confirmationResult {
            case .exchange(let productTitle, let variantTitle, let exchPrice,
                          let returnAmt, let diff, let diffType, let orderId, let delivery):
                exchangeConfirmationView(
                    productTitle: productTitle,
                    variantTitle: variantTitle,
                    exchPrice: exchPrice,
                    returnAmt: returnAmt,
                    diff: diff,
                    diffType: diffType,
                    orderId: orderId,
                    delivery: delivery
                )
            case .storeCredit(let amount, let creditId):
                storeCreditConfirmationView(amount: amount, creditId: creditId)
            default:
                // .refund or nil — show original QR drop-off screen
                refundConfirmationView
            }
        }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                withAnimation(.spring(response: 0.6, dampingFraction: 0.5)) {
                    showSuccess = true
                    showCelebration = true
                }
                RCHaptics.success()
            }
        }
    }

    // MARK: - Refund Screen (QR drop-off)

    private var refundConfirmationView: some View {
        ScrollView {
            VStack(spacing: RCSpacing.xl) {
                if showCelebration { CelebrationView().frame(height: 0) }

                // Header
                VStack(spacing: RCSpacing.lg) {
                    ZStack {
                        Circle()
                            .fill(Color.rcSuccess.opacity(0.08))
                            .frame(width: 120, height: 120)
                            .scaleEffect(showSuccess ? 1.2 : 0.8)
                            .opacity(showSuccess ? 0.6 : 0)
                            .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: showSuccess)
                        Circle()
                            .fill(Color.rcSuccess.opacity(0.12))
                            .frame(width: 100, height: 100)
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 64))
                            .foregroundStyle(LinearGradient.rcSuccess)
                            .scaleEffect(showSuccess ? 1.0 : 0.3)
                            .animation(.spring(response: 0.5, dampingFraction: 0.4), value: showSuccess)
                    }

                    Text("Return Approved!")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(.rcTextPrimary)

                    if case .refund(let amount) = flowState.confirmationResult {
                        HStack(spacing: RCSpacing.sm) {
                            Text("$\(amount.currencyString)")
                                .font(.system(size: 20, weight: .bold, design: .rounded))
                                .foregroundColor(.rcSuccess)
                            Text("refund to your card")
                                .font(.system(size: 15))
                                .foregroundColor(.rcTextSecondary)
                        }
                    } else if let option = flowState.selectedRefundOption {
                        HStack(spacing: RCSpacing.sm) {
                            Text("$\((option.amount + (option.bonusAmount ?? 0)).currencyString)")
                                .font(.system(size: 20, weight: .bold, design: .rounded))
                                .foregroundColor(.rcSuccess)
                            Text("refund to your card")
                                .font(.system(size: 15))
                                .foregroundColor(.rcTextSecondary)
                        }
                    }
                }
                .padding(.top, RCSpacing.lg)
                .slideIn(delay: 0.1)

                // QR Code
                returnLabelSection
                    .slideIn(delay: 0.3)

                // Instructions
                instructionsSection
                    .slideIn(delay: 0.4)

                // Timeline
                timelineSection(processingDays: flowState.policy?.processingDays ?? 5)
                    .slideIn(delay: 0.5)

                actionsSection
                    .slideIn(delay: 0.6)

                Spacer(minLength: 100)
            }
            .padding(.horizontal, RCSpacing.lg)
            .padding(.top, RCSpacing.sm)
        }
        .background(Color.rcSurface)
    }

    // MARK: - Exchange Screen

    private func exchangeConfirmationView(
        productTitle: String,
        variantTitle: String,
        exchPrice: Double,
        returnAmt: Double,
        diff: Double,
        diffType: String,
        orderId: String,
        delivery: String
    ) -> some View {
        ScrollView {
            VStack(spacing: RCSpacing.xl) {
                if showCelebration { CelebrationView().frame(height: 0) }

                // Header
                VStack(spacing: RCSpacing.lg) {
                    ZStack {
                        Circle()
                            .fill(Color.rcPrimary.opacity(0.1))
                            .frame(width: 120, height: 120)
                            .scaleEffect(showSuccess ? 1.15 : 0.8)
                            .opacity(showSuccess ? 0.5 : 0)
                            .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: showSuccess)
                        Circle()
                            .fill(Color.rcPrimary.opacity(0.12))
                            .frame(width: 100, height: 100)
                        Image(systemName: "arrow.triangle.2.circlepath.circle.fill")
                            .font(.system(size: 64))
                            .foregroundStyle(LinearGradient.rcPrimary)
                            .scaleEffect(showSuccess ? 1.0 : 0.3)
                            .animation(.spring(response: 0.5, dampingFraction: 0.4), value: showSuccess)
                    }

                    Text("Exchange Ordered!")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(.rcTextPrimary)

                    Text("Your new item is on its way")
                        .font(.subheadline)
                        .foregroundColor(.rcTextSecondary)
                }
                .padding(.top, RCSpacing.lg)
                .slideIn(delay: 0.1)

                // Order details card
                VStack(alignment: .leading, spacing: RCSpacing.lg) {
                    Text("Exchange Details")
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundColor(.rcTextPrimary)

                    VStack(spacing: RCSpacing.sm) {
                        HStack {
                            Text("New item")
                                .font(.system(size: 14))
                                .foregroundColor(.rcTextSecondary)
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text(productTitle)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.rcTextPrimary)
                                    .multilineTextAlignment(.trailing)
                                Text(variantTitle)
                                    .font(.system(size: 12))
                                    .foregroundColor(.rcTextSecondary)
                            }
                        }

                        Divider()

                        HStack {
                            Text("Return value")
                                .font(.system(size: 14))
                                .foregroundColor(.rcTextSecondary)
                            Spacer()
                            Text(String(format: "$%.2f", returnAmt))
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.rcTextPrimary)
                        }

                        HStack {
                            Text("Exchange price")
                                .font(.system(size: 14))
                                .foregroundColor(.rcTextSecondary)
                            Spacer()
                            Text(String(format: "$%.2f", exchPrice))
                                .font(.system(size: 14, weight: .medium))
                                .foregroundColor(.rcTextPrimary)
                        }

                        Divider()

                        HStack {
                            if diffType == "refund" {
                                Label("You'll receive back", systemImage: "arrow.down.circle.fill")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.rcSuccess)
                                Spacer()
                                Text(String(format: "$%.2f", diff))
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                                    .foregroundColor(.rcSuccess)
                            } else if diff > 0 {
                                Label("Additional charge", systemImage: "arrow.up.circle.fill")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.rcError)
                                Spacer()
                                Text(String(format: "$%.2f", diff))
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                                    .foregroundColor(.rcError)
                            } else {
                                Label("Even exchange", systemImage: "equal.circle.fill")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.rcTextSecondary)
                                Spacer()
                                Text("No charge")
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(.rcTextSecondary)
                            }
                        }
                    }

                    Divider()

                    HStack {
                        Label("Order ID", systemImage: "number")
                            .font(.system(size: 13))
                            .foregroundColor(.rcTextSecondary)
                        Spacer()
                        HStack(spacing: RCSpacing.xs) {
                            Text(orderId)
                                .font(.system(size: 13, weight: .medium, design: .monospaced))
                                .foregroundColor(.rcTextPrimary)
                            Button {
                                RCHaptics.impact(.light)
                                UIPasteboard.general.string = orderId
                            } label: {
                                Image(systemName: "doc.on.doc")
                                    .font(.system(size: 11))
                                    .foregroundColor(.rcPrimary)
                            }
                        }
                    }

                    HStack {
                        Label("Estimated delivery", systemImage: "shippingbox")
                            .font(.system(size: 13))
                            .foregroundColor(.rcTextSecondary)
                        Spacer()
                        Text(delivery)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundColor(.rcTextPrimary)
                    }
                }
                .rcCard()
                .slideIn(delay: 0.3)

                // Return the original item card
                VStack(alignment: .leading, spacing: RCSpacing.lg) {
                    Text("Return the Original Item")
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundColor(.rcTextPrimary)

                    InstructionRow(number: "1", title: "Pack your original item",
                                   description: "Use original packaging if available")
                    InstructionRow(number: "2", title: "Drop off at Canada Post",
                                   description: "Within 7 days to complete exchange")
                    InstructionRow(number: "3", title: "Show return QR code",
                                   description: "No printing required")

                    if let qrImage = generateQRCode(from: "RETURN-\(flowState.order?.orderNumber ?? "12345")") {
                        HStack {
                            Spacer()
                            Image(uiImage: qrImage)
                                .interpolation(.none)
                                .resizable()
                                .scaledToFit()
                                .frame(width: 120, height: 120)
                                .padding(RCSpacing.md)
                                .background(Color.white)
                                .cornerRadius(RCRadius.md)
                                .rcShadowCard()
                            Spacer()
                        }
                    }
                }
                .rcCard()
                .slideIn(delay: 0.4)

                Spacer(minLength: 100)
            }
            .padding(.horizontal, RCSpacing.lg)
            .padding(.top, RCSpacing.sm)
        }
        .background(Color.rcSurface)
    }

    // MARK: - Store Credit Screen

    private func storeCreditConfirmationView(amount: Decimal, creditId: String) -> some View {
        ScrollView {
            VStack(spacing: RCSpacing.xl) {
                if showCelebration { CelebrationView().frame(height: 0) }

                // Header
                VStack(spacing: RCSpacing.lg) {
                    ZStack {
                        Circle()
                            .fill(Color.rcSuccess.opacity(0.08))
                            .frame(width: 120, height: 120)
                            .scaleEffect(showSuccess ? 1.2 : 0.8)
                            .opacity(showSuccess ? 0.6 : 0)
                            .animation(.easeInOut(duration: 2).repeatForever(autoreverses: true), value: showSuccess)
                        Circle()
                            .fill(Color.rcSuccess.opacity(0.12))
                            .frame(width: 100, height: 100)
                        Image(systemName: "gift.circle.fill")
                            .font(.system(size: 64))
                            .foregroundStyle(LinearGradient.rcSuccess)
                            .scaleEffect(showSuccess ? 1.0 : 0.3)
                            .animation(.spring(response: 0.5, dampingFraction: 0.4), value: showSuccess)
                    }

                    Text("Store Credit Applied!")
                        .font(.system(size: 28, weight: .bold, design: .rounded))
                        .foregroundColor(.rcTextPrimary)

                    VStack(spacing: RCSpacing.xs) {
                        Text("$\(amount.currencyString)")
                            .font(.system(size: 40, weight: .bold, design: .rounded))
                            .foregroundColor(.rcSuccess)
                        Text("added to your account")
                            .font(.subheadline)
                            .foregroundColor(.rcTextSecondary)
                    }
                }
                .padding(.top, RCSpacing.lg)
                .slideIn(delay: 0.1)

                // Credit details card
                VStack(alignment: .leading, spacing: RCSpacing.lg) {
                    Text("Credit Details")
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundColor(.rcTextPrimary)

                    HStack {
                        Text("Credit ID")
                            .font(.system(size: 14))
                            .foregroundColor(.rcTextSecondary)
                        Spacer()
                        HStack(spacing: RCSpacing.xs) {
                            Text(creditId)
                                .font(.system(size: 14, weight: .medium, design: .monospaced))
                                .foregroundColor(.rcTextPrimary)
                            Button {
                                RCHaptics.impact(.light)
                                UIPasteboard.general.string = creditId
                            } label: {
                                Image(systemName: "doc.on.doc")
                                    .font(.system(size: 13))
                                    .foregroundColor(.rcPrimary)
                                    .padding(RCSpacing.sm)
                                    .background(Color.rcPrimary.opacity(0.1))
                                    .cornerRadius(RCRadius.sm)
                            }
                        }
                    }

                    HStack {
                        Text("Amount")
                            .font(.system(size: 14))
                            .foregroundColor(.rcTextSecondary)
                        Spacer()
                        Text("$\(amount.currencyString) CAD")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.rcSuccess)
                    }

                    HStack {
                        Text("Expires")
                            .font(.system(size: 14))
                            .foregroundColor(.rcTextSecondary)
                        Spacer()
                        Text("1 year from today")
                            .font(.system(size: 14))
                            .foregroundColor(.rcTextPrimary)
                    }
                }
                .rcCard()
                .slideIn(delay: 0.3)

                // How to use card
                VStack(alignment: .leading, spacing: RCSpacing.lg) {
                    Text("How to Use Your Credit")
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundColor(.rcTextPrimary)

                    InstructionRow(number: "1", title: "Shop the store",
                                   description: "Browse and add items to your cart")
                    InstructionRow(number: "2", title: "Enter credit at checkout",
                                   description: "Use code \(creditId) in the gift card field")
                    InstructionRow(number: "3", title: "Credit auto-applies",
                                   description: "Balance deducted automatically")

                    HStack(spacing: RCSpacing.sm) {
                        Image(systemName: "info.circle.fill")
                            .foregroundColor(.rcPrimary)
                            .font(.system(size: 14))
                        Text("Store credit can be used on any order and never expires sooner than the date above.")
                            .font(.system(size: 12))
                            .foregroundColor(.rcTextSecondary)
                    }
                    .padding(RCSpacing.md)
                    .background(Color.rcPrimary.opacity(0.06))
                    .cornerRadius(RCRadius.md)
                }
                .rcCard()
                .slideIn(delay: 0.4)

                // Drop off original item
                VStack(alignment: .leading, spacing: RCSpacing.lg) {
                    Text("Drop Off Your Item")
                        .font(.system(size: 17, weight: .semibold, design: .rounded))
                        .foregroundColor(.rcTextPrimary)

                    if let qrImage = generateQRCode(from: "RETURN-\(flowState.order?.orderNumber ?? "12345")") {
                        HStack {
                            Spacer()
                            Image(uiImage: qrImage)
                                .interpolation(.none)
                                .resizable()
                                .scaledToFit()
                                .frame(width: 120, height: 120)
                                .padding(RCSpacing.md)
                                .background(Color.white)
                                .cornerRadius(RCRadius.md)
                                .rcShadowCard()
                            Spacer()
                        }
                    }

                    Button {
                        RCHaptics.impact(.light)
                        if let url = URL(string: "maps://?q=Canada+Post") {
                            UIApplication.shared.open(url)
                        }
                    } label: {
                        HStack(spacing: RCSpacing.md) {
                            ZStack {
                                Circle()
                                    .fill(Color.rcPrimary.opacity(0.1))
                                    .frame(width: 40, height: 40)
                                Image(systemName: "mappin.circle.fill")
                                    .font(.system(size: 18))
                                    .foregroundColor(.rcPrimary)
                            }
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Find Nearest Drop-off")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.rcTextPrimary)
                                Text("Canada Post locations")
                                    .font(.system(size: 12))
                                    .foregroundColor(.rcTextSecondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundColor(.rcTextMuted)
                        }
                        .padding(RCSpacing.lg)
                        .background(Color.rcSurfaceElevated)
                        .cornerRadius(RCRadius.lg)
                        .overlay(RoundedRectangle(cornerRadius: RCRadius.lg).stroke(Color.rcBorder.opacity(0.6), lineWidth: 1))
                    }
                }
                .rcCard()
                .slideIn(delay: 0.5)

                Spacer(minLength: 100)
            }
            .padding(.horizontal, RCSpacing.lg)
            .padding(.top, RCSpacing.sm)
        }
        .background(Color.rcSurface)
    }

    // MARK: - Shared Subviews (used by refund screen)

    private var returnLabelSection: some View {
        VStack(spacing: RCSpacing.lg) {
            Text("Return Label")
                .font(.system(size: 17, weight: .semibold, design: .rounded))
                .foregroundColor(.rcTextPrimary)

            VStack(spacing: RCSpacing.md) {
                if let qrImage = generateQRCode(from: "RETURN-\(flowState.order?.orderNumber ?? "12345")") {
                    ZStack {
                        RoundedRectangle(cornerRadius: RCRadius.lg)
                            .fill(Color.white)
                            .frame(width: 210, height: 210)
                            .rcShadowElevated()
                        RoundedRectangle(cornerRadius: RCRadius.md)
                            .stroke(
                                LinearGradient(
                                    colors: [.rcPrimary.opacity(0.3), .rcPrimaryLight.opacity(0.3)],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                ), lineWidth: 2
                            )
                            .frame(width: 210, height: 210)
                        Image(uiImage: qrImage)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 170, height: 170)
                    }
                }
                Text("Show this code at drop-off")
                    .font(.system(size: 13))
                    .foregroundColor(.rcTextSecondary)
            }

            HStack(spacing: RCSpacing.sm) {
                Text("Return ID:")
                    .font(.system(size: 13))
                    .foregroundColor(.rcTextSecondary)
                Text("RTN-\(String(flowState.order?.orderNumber.suffix(8) ?? "00000000"))")
                    .font(.system(size: 14, weight: .medium, design: .monospaced))
                    .foregroundColor(.rcTextPrimary)
                Button {
                    RCHaptics.impact(.light)
                    UIPasteboard.general.string = "RTN-\(String(flowState.order?.orderNumber.suffix(8) ?? "00000000"))"
                } label: {
                    Image(systemName: "doc.on.doc")
                        .font(.system(size: 13))
                        .foregroundColor(.rcPrimary)
                        .padding(RCSpacing.sm)
                        .background(Color.rcPrimary.opacity(0.1))
                        .cornerRadius(RCRadius.sm)
                }
            }
        }
        .rcCard()
    }

    private var instructionsSection: some View {
        VStack(alignment: .leading, spacing: RCSpacing.lg) {
            Text("Next Steps")
                .font(.system(size: 17, weight: .semibold, design: .rounded))
                .foregroundColor(.rcTextPrimary)
            InstructionRow(number: "1", title: "Pack your item", description: "Use original packaging if available")
            InstructionRow(number: "2", title: "Drop off at Canada Post", description: "Find nearest location below")
            InstructionRow(number: "3", title: "Show QR code", description: "No printing required")
            Button {
                RCHaptics.impact(.light)
                if let url = URL(string: "maps://?q=Canada+Post") { UIApplication.shared.open(url) }
            } label: {
                HStack(spacing: RCSpacing.md) {
                    ZStack {
                        Circle().fill(Color.rcPrimary.opacity(0.1)).frame(width: 40, height: 40)
                        Image(systemName: "mappin.circle.fill").font(.system(size: 18)).foregroundColor(.rcPrimary)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Find Nearest Drop-off").font(.system(size: 14, weight: .semibold)).foregroundColor(.rcTextPrimary)
                        Text("Canada Post locations").font(.system(size: 12)).foregroundColor(.rcTextSecondary)
                    }
                    Spacer()
                    Image(systemName: "chevron.right").font(.system(size: 12, weight: .semibold)).foregroundColor(.rcTextMuted)
                }
                .padding(RCSpacing.lg)
                .background(Color.rcSurfaceElevated)
                .cornerRadius(RCRadius.lg)
                .overlay(RoundedRectangle(cornerRadius: RCRadius.lg).stroke(Color.rcBorder.opacity(0.6), lineWidth: 1))
            }
        }
    }

    private func timelineSection(processingDays: Int) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Timeline")
                .font(.system(size: 17, weight: .semibold, design: .rounded))
                .foregroundColor(.rcTextPrimary)
                .padding(.bottom, RCSpacing.lg)
            TimelineRow(icon: "shippingbox", title: "Drop off item", subtitle: "Within 7 days", isComplete: false, isLast: false)
            TimelineRow(icon: "building.2", title: "Item received", subtitle: "1-3 business days after drop-off", isComplete: false, isLast: false)
            TimelineRow(icon: "checkmark.circle", title: "Refund processed", subtitle: "\(processingDays) business days", isComplete: false, isLast: true)
        }
        .rcCard()
    }

    private var actionsSection: some View {
        VStack(spacing: RCSpacing.md) {
            Button {
                RCHaptics.impact(.medium)
            } label: {
                HStack(spacing: RCSpacing.sm) {
                    Image(systemName: "square.and.arrow.up")
                    Text("Share Return Details")
                }
            }
            .buttonStyle(RCPrimaryButtonStyle())

            Button {
                RCHaptics.impact(.light)
            } label: {
                HStack(spacing: RCSpacing.sm) {
                    Image(systemName: "wallet.pass.fill")
                    Text("Add to Apple Wallet")
                }
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.black)
                .foregroundColor(.white)
                .cornerRadius(RCRadius.lg)
            }
        }
    }

    // MARK: - Helpers

    private func generateQRCode(from string: String) -> UIImage? {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(string.utf8)
        filter.correctionLevel = "M"
        guard let outputImage = filter.outputImage else { return nil }
        let scaled = outputImage.transformed(by: CGAffineTransform(scaleX: 10, y: 10))
        guard let cgImage = context.createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }
}

// MARK: - Supporting Views

struct InstructionRow: View {
    let number: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: RCSpacing.lg) {
            ZStack {
                Circle()
                    .fill(LinearGradient.rcPrimary)
                    .frame(width: 28, height: 28)
                Text(number)
                    .font(.system(size: 13, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.rcTextPrimary)
                Text(description)
                    .font(.system(size: 12))
                    .foregroundColor(.rcTextSecondary)
            }
        }
    }
}

struct TimelineRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let isComplete: Bool
    var isLast: Bool = false

    var body: some View {
        HStack(alignment: .top, spacing: RCSpacing.lg) {
            VStack(spacing: 0) {
                ZStack {
                    Circle()
                        .fill(isComplete ? Color.rcSuccess.opacity(0.12) : Color.rcSurfaceMuted)
                        .frame(width: 36, height: 36)
                        .overlay(Circle().stroke(isComplete ? Color.rcSuccess.opacity(0.3) : Color.rcBorder, lineWidth: 1.5))
                    Image(systemName: isComplete ? "checkmark" : icon)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(isComplete ? .rcSuccess : .rcTextMuted)
                }
                if !isLast {
                    Rectangle().fill(Color.rcBorder).frame(width: 2, height: 32)
                }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.rcTextPrimary)
                Text(subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.rcTextSecondary)
            }
            .padding(.top, 6)
            Spacer()
            if isComplete {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.rcSuccess)
                    .font(.system(size: 18))
                    .padding(.top, 6)
            }
        }
    }
}
