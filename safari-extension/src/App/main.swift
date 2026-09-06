import Cocoa
import SafariServices

class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Load app icon
        let appBundle = Bundle.main
        var appIconImage: NSImage?
        if let iconPath = appBundle.path(forResource: "AppIcon", ofType: "icns") {
            appIconImage = NSImage(contentsOfFile: iconPath)
        } else if let iconPath = appBundle.path(forResource: "AppIcon", ofType: "png") {
            appIconImage = NSImage(contentsOfFile: iconPath)
        }
        if let img = appIconImage {
            NSApp.applicationIconImage = img
        }

        let windowWidth: CGFloat = 520
        let windowHeight: CGFloat = 450

        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: windowWidth, height: windowHeight),
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        window.center()
        window.title = "Markdown Comments for Safari"

        let contentView = NSView(frame: NSRect(x: 0, y: 0, width: windowWidth, height: windowHeight))
        window.contentView = contentView

        // Main Container Stack with 24px margins on all sides
        let mainStack = NSStackView()
        mainStack.orientation = .vertical
        mainStack.alignment = .leading
        mainStack.spacing = 16
        mainStack.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(mainStack)

        NSLayoutConstraint.activate([
            mainStack.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 20),
            mainStack.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 24),
            mainStack.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -24),
            mainStack.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -20)
        ])

        // Header Row: Icon + Title & Slogan
        let headerRow = NSStackView()
        headerRow.orientation = .horizontal
        headerRow.alignment = .centerY
        headerRow.spacing = 16
        headerRow.translatesAutoresizingMaskIntoConstraints = false

        let iconView = NSImageView()
        iconView.image = appIconImage ?? NSImage(named: NSImage.applicationIconName)
        iconView.imageScaling = .scaleProportionallyUpOrDown
        iconView.wantsLayer = true
        iconView.layer?.cornerRadius = 10
        iconView.layer?.masksToBounds = true
        iconView.translatesAutoresizingMaskIntoConstraints = false
        iconView.widthAnchor.constraint(equalToConstant: 52).isActive = true
        iconView.heightAnchor.constraint(equalToConstant: 52).isActive = true
        headerRow.addArrangedSubview(iconView)

        let titleStack = NSStackView()
        titleStack.orientation = .vertical
        titleStack.alignment = .leading
        titleStack.spacing = 4

        let titleLabel = NSTextField(labelWithString: "Markdown Comments")
        titleLabel.font = NSFont.systemFont(ofSize: 19, weight: .bold)
        titleStack.addArrangedSubview(titleLabel)

        let headlineLabel = NSTextField(labelWithString: "AI-orchestrated docs. Human-orchestrated comments.")
        headlineLabel.font = NSFont.systemFont(ofSize: 12, weight: .semibold)
        headlineLabel.textColor = .labelColor
        titleStack.addArrangedSubview(headlineLabel)

        let subtitleLabel = NSTextField(wrappingLabelWithString: "Docs and comments live in your Git repo — zero SaaS silos, zero PR overhead.")
        subtitleLabel.font = NSFont.systemFont(ofSize: 12, weight: .regular)
        subtitleLabel.textColor = .secondaryLabelColor
        titleStack.addArrangedSubview(subtitleLabel)

        headerRow.addArrangedSubview(titleStack)
        mainStack.addArrangedSubview(headerRow)
        headerRow.widthAnchor.constraint(equalTo: mainStack.widthAnchor).isActive = true

        // Instructions Card (NSBox)
        let box = NSBox()
        box.boxType = .custom
        box.cornerRadius = 10
        box.borderWidth = 1
        box.borderColor = NSColor.separatorColor
        box.fillColor = NSColor.controlBackgroundColor.withAlphaComponent(0.5)
        box.translatesAutoresizingMaskIntoConstraints = false

        let boxStack = NSStackView()
        boxStack.orientation = .vertical
        boxStack.alignment = .leading
        boxStack.spacing = 12
        boxStack.edgeInsets = NSEdgeInsets(top: 14, left: 16, bottom: 14, right: 16)
        boxStack.translatesAutoresizingMaskIntoConstraints = false

        let setupHeading = NSTextField(labelWithString: "Follow these steps to enable the extension in Safari:")
        setupHeading.font = NSFont.systemFont(ofSize: 13, weight: .semibold)
        boxStack.addArrangedSubview(setupHeading)

        // Step 1
        let step1 = createStepRow(
            number: "1",
            title: "Allow Unsigned Extensions",
            detail: "Open Safari → Settings → Developer tab (or Develop menu) and check \"Allow Unsigned Extensions\"."
        )
        boxStack.addArrangedSubview(step1)
        step1.widthAnchor.constraint(equalTo: boxStack.widthAnchor, constant: -32).isActive = true

        // Step 2
        let step2 = createStepRow(
            number: "2",
            title: "Enable Extension",
            detail: "Open Safari → Settings → Extensions and check the box next to \"Markdown Comments\"."
        )
        boxStack.addArrangedSubview(step2)
        step2.widthAnchor.constraint(equalTo: boxStack.widthAnchor, constant: -32).isActive = true

        // Step 3
        let step3 = createStepRow(
            number: "3",
            title: "One-Click Direct Load (Instant Alternative)",
            detail: "In Safari menu bar: Develop → Add Temporary Extension… then select the extension folder."
        )
        boxStack.addArrangedSubview(step3)
        step3.widthAnchor.constraint(equalTo: boxStack.widthAnchor, constant: -32).isActive = true

        box.contentView = NSView()
        box.contentView!.addSubview(boxStack)
        NSLayoutConstraint.activate([
            boxStack.topAnchor.constraint(equalTo: box.topAnchor),
            boxStack.bottomAnchor.constraint(equalTo: box.bottomAnchor),
            boxStack.leadingAnchor.constraint(equalTo: box.leadingAnchor),
            boxStack.trailingAnchor.constraint(equalTo: box.trailingAnchor)
        ])

        mainStack.addArrangedSubview(box)
        box.widthAnchor.constraint(equalTo: mainStack.widthAnchor).isActive = true

        // Flexible Vertical Spacer
        let vSpacer = NSView()
        vSpacer.setContentHuggingPriority(.defaultLow, for: .vertical)
        mainStack.addArrangedSubview(vSpacer)

        // Bottom Action Row
        let buttonRow = NSStackView()
        buttonRow.orientation = .horizontal
        buttonRow.alignment = .centerY
        buttonRow.spacing = 10
        buttonRow.translatesAutoresizingMaskIntoConstraints = false

        let revealButton = NSButton(title: "Reveal in Finder", target: self, action: #selector(revealExtensionFolder))
        revealButton.bezelStyle = .rounded
        revealButton.toolTip = "Reveal the extension folder for 'Add Temporary Extension…'"
        buttonRow.addArrangedSubview(revealButton)

        let spacer = NSView()
        spacer.setContentHuggingPriority(.defaultLow, for: .horizontal)
        buttonRow.addArrangedSubview(spacer)

        let openSettingsButton = NSButton(title: "Open Safari Settings…", target: self, action: #selector(openSafariSettings))
        openSettingsButton.bezelStyle = .rounded
        openSettingsButton.keyEquivalent = "\r"
        buttonRow.addArrangedSubview(openSettingsButton)

        let quitButton = NSButton(title: "Quit", target: self, action: #selector(quitApp))
        quitButton.bezelStyle = .rounded
        buttonRow.addArrangedSubview(quitButton)

        mainStack.addArrangedSubview(buttonRow)
        buttonRow.widthAnchor.constraint(equalTo: mainStack.widthAnchor).isActive = true

        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func createStepRow(number: String, title: String, detail: String) -> NSStackView {
        let row = NSStackView()
        row.orientation = .horizontal
        row.alignment = .top
        row.spacing = 10
        row.translatesAutoresizingMaskIntoConstraints = false

        let numBadge = NSTextField(labelWithString: "  \(number)  ")
        numBadge.font = NSFont.systemFont(ofSize: 11, weight: .bold)
        numBadge.textColor = .controlAccentColor
        numBadge.wantsLayer = true
        numBadge.layer?.backgroundColor = NSColor.controlAccentColor.withAlphaComponent(0.15).cgColor
        numBadge.layer?.cornerRadius = 4
        numBadge.setContentHuggingPriority(.required, for: .horizontal)
        row.addArrangedSubview(numBadge)

        let textStack = NSStackView()
        textStack.orientation = .vertical
        textStack.alignment = .leading
        textStack.spacing = 2
        textStack.translatesAutoresizingMaskIntoConstraints = false

        let titleLabel = NSTextField(labelWithString: title)
        titleLabel.font = NSFont.systemFont(ofSize: 12, weight: .semibold)
        textStack.addArrangedSubview(titleLabel)

        let detailLabel = NSTextField(wrappingLabelWithString: detail)
        detailLabel.font = NSFont.systemFont(ofSize: 11, weight: .regular)
        detailLabel.textColor = .secondaryLabelColor
        textStack.addArrangedSubview(detailLabel)

        row.addArrangedSubview(textStack)
        return row
    }

    @objc func openSafariSettings() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "org.mdcomments.safari.Extension") { error in
            if error != nil {
                if let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: "com.apple.Safari") {
                    NSWorkspace.shared.openApplication(at: url, configuration: NSWorkspace.OpenConfiguration(), completionHandler: nil)
                }
            }
        }
    }

    @objc func revealExtensionFolder() {
        let repoPath = "/Users/maratstrelets/git/md-comments/md-comments/chrome-extension/dist/safari"
        if FileManager.default.fileExists(atPath: repoPath) {
            NSWorkspace.shared.selectFile(repoPath, inFileViewerRootedAtPath: "")
        } else {
            let bundleURL = Bundle.main.bundleURL
            let extPath = bundleURL.appendingPathComponent("Contents/PlugIns/Markdown Comments Extension.appex/Contents/Resources").path
            NSWorkspace.shared.selectFile(extPath, inFileViewerRootedAtPath: "")
        }
    }

    @objc func quitApp() {
        NSApplication.shared.terminate(nil)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
