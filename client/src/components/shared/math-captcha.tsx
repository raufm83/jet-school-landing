"use client";

import { UseFormRegister } from "react-hook-form";
import { MdRefresh } from "react-icons/md";
import { RequestFormInputs } from "@/types/request";

type MathCaptchaProps = {
  question?: string;
  challengeError?: boolean;
  loadErrorMessage?: string;
  /**
   * Token gələnə qədər yazılmır. `disabled` istifadə etmirik — RHF disabled
   * sahələri submit payload-a daxil etmir.
   */
  answerLocked?: boolean;
  loading: boolean;
  error?: string;
  register: UseFormRegister<RequestFormInputs>;
  onRefresh: () => void;
  label: string;
  placeholder: string;
  requiredMessage: string;
};

export default function MathCaptcha({
  question,
  challengeError = false,
  loadErrorMessage,
  answerLocked = false,
  loading,
  error,
  register,
  onRefresh,
  label,
  placeholder,
  requiredMessage,
}: MathCaptchaProps) {
  const questionText = question ? `${question} =` : loading ? "..." : "? + ? =";
  const inputLocked = answerLocked || loading;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-jsblack">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="flex h-12 min-w-[92px] items-center justify-center rounded-[32px] border border-jsyellow bg-[#fef7eb] px-4 font-semibold text-jsblack">
          {questionText}
        </div>
        <input
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          readOnly={inputLocked}
          className={`h-12 min-w-0 flex-1 rounded-[32px] border border-jsyellow bg-[#fef7eb] px-4 py-3 shadow-sm transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-jsyellow ${
            inputLocked ? "cursor-not-allowed opacity-60" : ""
          }`}
          {...register("mathCaptchaAnswer", {
            required: requiredMessage,
          })}
          onInput={(e) => {
            const target = e.target as HTMLInputElement;
            target.value = target.value.replace(/\D/g, "");
          }}
        />
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label={label}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-jsyellow bg-[#fef7eb] text-xl text-jsblack transition-colors hover:bg-jsyellow/10 disabled:opacity-50"
        >
          <MdRefresh />
        </button>
      </div>
      {challengeError && loadErrorMessage && (
        <p className="text-red-500 text-sm pl-2">{loadErrorMessage}</p>
      )}
      {error && <p className="text-red-500 text-sm pl-2">{error}</p>}
    </div>
  );
}
