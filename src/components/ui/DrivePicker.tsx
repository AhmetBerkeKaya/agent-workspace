"use client";

import { useSession } from "next-auth/react";
import { Cloud, Loader2 } from "lucide-react";
import { useState } from "react";

export function DrivePicker({ onFileSelect }: { onFileSelect: (file: any) => void }) {
  const { data: session } = useSession();
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenPicker = () => {
    setIsOpening(true);
    // @ts-ignore
    const gapi = window.gapi;
    // @ts-ignore
    const google = window.google;

    if (!gapi || !google) {
      console.error("Google API henüz yüklenmedi.");
      setIsOpening(false);
      return;
    }

    const createPicker = () => {
      const view = new google.picker.View(google.picker.ViewId.DOCS);
      const picker = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken((session as any)?.accessToken)
        .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
        .setOrigin(window.location.protocol + "//" + window.location.host)
        .setCallback((data: any) => {
          if (data.action === google.picker.Action.PICKED) {
            onFileSelect(data.docs[0]);
          }
          if (data.action === google.picker.Action.CANCEL || data.action === google.picker.Action.PICKED) {
            setIsOpening(false);
          }
        })
        .build();
      picker.setVisible(true);
    };

    gapi.load("picker", { callback: createPicker });
  };

  return (
    <button
      onClick={handleOpenPicker}
      disabled={isOpening}
      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
    >
      {isOpening ? <Loader2 size={14} className="animate-spin" /> : <Cloud size={14} />}
      DRIVE
    </button>
  );
}