import React from 'react';
import { X, Shield, ExternalLink } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="privacy-modal-backdrop"
      className="fixed inset-0 z-[70] bg-[#071330]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
    >
      <div
        id="privacy-modal-outer-frame"
        className="w-full max-w-lg relative p-2 sm:p-2.5 rounded-3xl bg-gradient-to-b from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] border-2 sm:border-3 border-[#7DD3FC] shadow-[0_20px_50px_rgba(2,132,199,0.5),inset_0_2px_4px_rgba(255,255,255,0.7)] max-h-[90vh] flex flex-col"
      >
        <div
          id="privacy-modal-card"
          className="bg-[#071330] rounded-2xl sm:rounded-[20px] p-4 sm:p-5 border border-[#0F2864] shadow-[inset_0_3px_12px_rgba(0,0,0,0.8)] relative text-white flex flex-col flex-1 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E3A8A] pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-sky-500 to-blue-600 text-white flex items-center justify-center font-black shadow-md border border-sky-300">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Privacy Policy
                </h2>
                <p className="text-[11px] font-semibold text-cyan-200/70">
                  Transparency & Data Protection
                </p>
              </div>
            </div>

            <button
              id="privacy-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-blue-200 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto pr-1 text-xs text-slate-300 space-y-3.5 leading-relaxed select-text flex-1">
            <div className="p-2.5 bg-[#0C2158]/70 border border-[#1E3A8A] rounded-xl text-[11px] text-cyan-200/90 flex items-center justify-between">
              <span>Updated: September 2026</span>
              <a
                href="/privacy.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold hover:underline"
              >
                <span>Full Web Version</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <section>
              <h3 className="text-white font-bold text-sm mb-1 text-sky-300">1. Overview</h3>
              <p>
                AlphaBlast (developed by Alexander Castillo) respects and protects your privacy. This policy outlines how information is handled when using the AlphaBlast word puzzle game.
              </p>
            </section>

            <section>
              <h3 className="text-white font-bold text-sm mb-1 text-sky-300">2. Information We Collect</h3>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong className="text-white">Game Progress:</strong> Unlocked categories, coins, stars, high scores (saved on your device and synced via Google Cloud Firestore).</li>
                <li><strong className="text-white">Technical Diagnostics:</strong> Browser type, device model, operating system, and performance telemetry.</li>
                <li><strong className="text-white">Advertising Identifiers:</strong> Non-personal identifiers used exclusively to deliver ads and measure gameplay engagement.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-bold text-sm mb-1 text-sky-300">3. Google AdSense & AdMob Integration</h3>
              <p>
                We use Google AdSense and Google AdMob to deliver banner, interstitial, and rewarded game ads. Google and its ad partners use cookies and device identifiers to serve advertisements. European and UK players can manage ad consent preferences through the built-in Google Consent Management dialog.
              </p>
            </section>

            <section>
              <h3 className="text-white font-bold text-sm mb-1 text-sky-300">4. Your Privacy Rights</h3>
              <p>
                In compliance with GDPR (Europe) and CCPA/CPRA (California), you have the right to request access, deletion, or restriction of your data. We do not sell personal information.
              </p>
            </section>

            <section>
              <h3 className="text-white font-bold text-sm mb-1 text-sky-300">5. Contact Information</h3>
              <p>
                For questions regarding data or privacy, contact Alexander Castillo at:
                <br />
                <a href="mailto:alx.mobileapps@gmail.com" className="text-sky-400 hover:underline font-semibold">
                  alx.mobileapps@gmail.com
                </a>
              </p>
            </section>
          </div>

          {/* Footer actions */}
          <div className="pt-3 mt-2 border-t border-[#1E3A8A] flex gap-2 shrink-0">
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 rounded-xl bg-[#0C2158] hover:bg-[#132E75] border border-[#1E3A8A] text-sky-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Browser</span>
            </a>
            <button
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0369A1] hover:from-[#38BDF8] hover:to-[#0284C7] text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
