import React, { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { Category } from '../types';
import { haptics } from '../utils/haptics';
import {
  checkCustomGamePassword,
  rememberCustomGamePasswordUnlocked,
} from '../utils/customCategoriesService';

interface CustomGamePasswordModalProps {
  // The password-protected custom game the player tried to open, or null
  // when the modal is closed.
  category: Category | null;
  onUnlocked: (category: Category) => void;
  onClose: () => void;
}

/**
 * Asked before playing a custom game whose creator set an (optional)
 * password. The right password is remembered on this device, so the player
 * only has to type it once per game (until the creator changes it).
 */
export const CustomGamePasswordModal: React.FC<CustomGamePasswordModalProps> = ({
  category,
  onUnlocked,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPassword('');
    setError(null);
    if (category) {
      // Focus after the modal has rendered so the keyboard comes up.
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [category]);

  if (!category) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please type the password.');
      return;
    }
    if (checkCustomGamePassword(category, password)) {
      haptics.tap();
      rememberCustomGamePasswordUnlocked(category);
      onUnlocked(category);
    } else {
      setError('Wrong password. Ask the creator of this game for it.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-center justify-center p-4 select-none animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="bg-white border-4 border-gray-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-[#2D3748] animate-scale-in text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-purple-100 border-2 border-purple-200 flex items-center justify-center mx-auto mb-4 text-purple-600 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black text-[#2D3748] mb-1">Password Needed</h2>
        <p className="text-gray-600 text-xs sm:text-sm mb-4 leading-relaxed">
          <strong className="text-purple-600 font-black">
            {category.icon} {category.name}
          </strong>{' '}
          is protected by its creator. Type the password to play.
        </p>

        <input
          ref={inputRef}
          id="custom-game-password-input"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          placeholder="Password"
          maxLength={20}
          className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-base font-bold text-gray-800 text-center focus:bg-white focus:border-purple-500 focus:outline-none transition-colors mb-2"
        />

        {error && <p className="text-rose-600 text-xs font-bold mb-2">{error}</p>}

        <div className="flex flex-col gap-2.5 mt-2">
          <button
            id="custom-game-password-submit"
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-sm sm:text-base shadow-md transition-transform active:scale-95 cursor-pointer"
          >
            Play
          </button>
          <button
            id="custom-game-password-cancel"
            type="button"
            onClick={onClose}
            className="w-full py-2 px-6 text-gray-400 font-bold text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
