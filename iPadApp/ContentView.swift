import SwiftUI

struct ContentView: View {
    @State private var copied = false

    private let steps = [
        "Open the Settings app on your iPad.",
        "Go to Apps › Safari › Extensions (older iPadOS: Safari › Extensions).",
        "Tap “Glass New Tab” and switch it on.",
        "Allow it on all websites if prompted.",
        "In Safari Settings, set New Tab Page to Glass New Tab (Settings › Safari › Open New Tabs with)."
    ]

    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(hex: 0x090D16), Color(hex: 0x111827)], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()
            Circle().fill(Color(hex: 0x38BDF8).opacity(0.12)).frame(width: 420).blur(radius: 70).offset(x: -180, y: -280)
            Circle().fill(Color(hex: 0x6366F1).opacity(0.10)).frame(width: 480).blur(radius: 80).offset(x: 200, y: 320)

            ScrollView {
                VStack(spacing: 24) {
                    VStack(spacing: 8) {
                        Text("Glass New Tab").font(.system(size: 38, weight: .semibold)).foregroundColor(Color(hex: 0xF8FAFC))
                        Text("Enable the extension in three minutes.").font(.title3).foregroundColor(Color(hex: 0x94A3B8))
                    }.padding(.top, 32)

                    GlassCard {
                        VStack(alignment: .leading, spacing: 16) {
                            ForEach(Array(steps.enumerated()), id: \.offset) { i, s in
                                HStack(alignment: .top, spacing: 14) {
                                    Text("\(i + 1)").font(.subheadline.bold()).foregroundColor(Color(hex: 0x38BDF8))
                                        .frame(width: 28, height: 28)
                                        .background(Circle().fill(Color(hex: 0x38BDF8).opacity(0.15)))
                                    Text(s).foregroundColor(Color(hex: 0xF8FAFC)).fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            Button {
                                if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
                            } label: {
                                Text("Open Settings").font(.headline).frame(maxWidth: .infinity, minHeight: 48)
                            }
                            .foregroundColor(Color(hex: 0x38BDF8))
                            .background(RoundedRectangle(cornerRadius: 14).fill(Color(hex: 0x38BDF8).opacity(0.18)))
                            Text("iPadOS can’t deep-link straight into Safari’s extension list, so this opens the app’s Settings page. Navigate to Safari from there.")
                                .font(.footnote).foregroundColor(Color(hex: 0x94A3B8))
                        }
                    }

                    GlassCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("PARTNER INSIGHT • SPONSORED").font(.system(size: 10, weight: .regular)).tracking(1.6).foregroundColor(Color(hex: 0x94A3B8))
                            Text("$1,000 in cloud credits for early-stage teams").font(.title3.weight(.semibold)).foregroundColor(Color(hex: 0xF8FAFC))
                            Text("Live preview of the perk card. Tap the code to try the copy interaction.").foregroundColor(Color(hex: 0x94A3B8))
                            Button {
                                UIPasteboard.general.string = "IPADPRO20"
                                withAnimation(.easeInOut(duration: 0.2)) { copied = true }
                                DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) { withAnimation { copied = false } }
                            } label: {
                                Text(copied ? "Copied ✓" : "Copy code · IPADPRO20")
                                    .font(.headline).padding(.horizontal, 18).frame(minHeight: 44)
                            }
                            .foregroundColor(copied ? Color(hex: 0x6EE7B7) : Color(hex: 0x38BDF8))
                            .background(Capsule().strokeBorder(copied ? Color(hex: 0x6EE7B7) : Color(hex: 0x38BDF8), style: StrokeStyle(lineWidth: 1, dash: copied ? [] : [4])))
                        }
                    }
                }
                .frame(maxWidth: 620)
                .padding(24)
                .frame(maxWidth: .infinity)
            }
        }
        .preferredColorScheme(.dark)
    }
}

struct GlassCard<Content: View>: View {
    @ViewBuilder var content: Content
    var body: some View {
        content
            .padding(24)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(
                LinearGradient(colors: [.white.opacity(0.28), .white.opacity(0.10)], startPoint: .top, endPoint: .bottom), lineWidth: 1))
            .shadow(color: .black.opacity(0.45), radius: 24, y: 16)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255)
    }
}

#Preview { ContentView() }
