import { useState, useRef } from "react";
  import { Upload, X, Loader2 } from "lucide-react";

  interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label?: string;
    aspect?: "square" | "wide";
  }

  export function ImageUpload({ value, onChange, label = "Upload Image", aspect = "square" }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/uploads/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: base64, contentType: file.type }),
        });

        const json = await res.json();
        if (json.url) {
          onChange(json.url);
        } else {
          setError(json.error || "Upload failed");
        }
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    };

    return (
      <div className="space-y-2">
        {label && <p className="text-sm font-medium text-foreground">{label}</p>}
        <div
          className={`relative border-2 border-dashed border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-colors ${aspect === "wide" ? "aspect-[3/1]" : "aspect-square"} max-w-xs`}
          onClick={() => inputRef.current?.click()}
          data-testid="image-upload-area"
        >
          {value ? (
            <>
              <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
              <button
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                data-testid="button-remove-image"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
              {uploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <Upload size={24} />
                  <span className="text-xs text-center px-2">{label}</span>
                </>
              )}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          data-testid="input-image-file"
        />
      </div>
    );
  }
  