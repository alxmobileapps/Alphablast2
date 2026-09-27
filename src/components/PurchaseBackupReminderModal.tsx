import React, { useEffect, useState } from 'react';
import { ShieldAlert, Copy, Check } from 'lucide-react';
import { haptics } from '../utils/haptics';
import { playTileSelect } from '../utils/audio';

interface PurchaseBackupReminderModalProps {
  isOpen: boolean;
  /** The player's Cloud Sync / Backup Code (see authService.getOrCreateLocalSyncKey). */
  code: string;
  onClose: () => void;
}

/**
 * Shown right after a real-money purchase (Remove Ads or a Diamond Pack)
 * completes. Purchases aren't restorable via a Play Store "Restore
 * Purchases" button in this app (see medianBridge.restorePurchases -- it's
 * wired up but has no UI entry point, and Play Billing itself can't restore
 * consumables like diamonds anyway). What DOES already work is the existing
 * Cloud Sync / Backup Code system in ProfileModal: syncProgressToCloud() is
 * already called automatically after every purchase, so the player's
 * purchase state is safely backed up -- but only THEY know which code to
 * type back in after a reinstall or a new phone, and nothing ever told them
 * to save it. This modal closes that gap at the one moment it matters most:
 * right after they've paid for something.
 *
 * The "OK" button is disabled for 5 seconds on open so the reminder can't be
 * reflex-dismissed before it's actually read (this was explicitly requested,
 * not an accessibility idiom to imitate elsewhere in the app).
 */
export const PurchaseBackupReminderModal: React.FC<PurchaseBackupReminderModalProps> = ({
  isOpen,
  code,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [copied, setCopied] = useState(false);

  // Reset the forced-read countdown (and any stale "Copied!" state) every
  // time the modal is (re)opened for a new purchase.
  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(5);
    setCopied(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [isOpen, secondsLeft]);

  if (!isOpen) return null;

  const canDismiss = secondsLeft <= 0;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(true);
      haptics.tap();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable -- the code is still shown on screen for
      // the player to write down manually.
    }
  };

  const handleClose = () => {
    if (!canDismiss) return;
    haptics.specialCreated();
    playTileSelect();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-[#0B1E52] border-3 border-amber-400/60 rounded-3xl max-w-sm w-full shadow-[0_15px_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col text-white animate-scale-in">
        {/* Decorative Ambient Glows */}
        <div className="fx-ambient-glow absolute -top-12 -left-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-40 bg-amber-400" />
        <div className="fx-ambient-glow absolute -bottom-12 -right-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-30 bg-yellow-500" />

        <div className="p-6 text-center flex flex-col items-center relative z-10">
          {/* Icon Badge */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-4 border-2 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 border-yellow-200 text-amber-950 shadow-amber-500/30">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white leading-snug mb-1.5">
            Purchase Successful!
          </h3>
          <p className="text-xs text-blue-200/90 leading-relaxed mb-4 px-1">
            Save this Backup Code now. You'll need it to restore your purchase
            and progress if you switch phones or reinstall the app.
          </p>

          {/* The Code -- big, bold, yellow, per requirement */}
          <div className="w-full bg-[#081844] border-2 border-amber-400/50 rounded-2xl px-4 py-4 mb-2 shadow-inner">
            <span className="text-[10px] uppercase font-bold text-amber-300/70 block mb-1 tracking-wider">
              Your Backup Code
            </span>
            <span className="font-mono font-black text-3xl sm:text-4xl text-yellow-300 tracking-[0.15em] break-all drop-shadow-[0_2px_6px_rgba(250,204,21,0.5)]">
              {code}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="mb-5 flex items-center gap-1.5 text-[11px] font-bold text-amber-200 hover:text-amber-100 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-400/40 rounded-full px-3 py-1.5 transition-all active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          <button
            onClick={handleClose}
            disabled={!canDismiss}
            className={`w-full py-3 px-4 rounded-xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer border-2 ${
              canDismiss
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-amber-950 border-yellow-200 shadow-amber-500/40 active:scale-95'
                : 'bg-[#0F2868] text-blue-300/60 border-[#23469E] cursor-not-allowed opacity-70'
            }`}
          >
            <span>{canDismiss ? 'OK, I Saved It' : `OK (${secondsLeft})`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
