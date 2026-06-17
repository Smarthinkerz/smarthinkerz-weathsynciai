import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ja", label: "日本語" },
  { code: "ar", label: "العربية" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const current = i18n.language || "en";

  return (
    <div className="flex items-center gap-2" data-testid="language-switcher">
      {!compact && <Globe className="h-4 w-4 text-muted-foreground" />}
      <Select value={current} onValueChange={(v) => i18n.changeLanguage(v)}>
        <SelectTrigger className={compact ? "w-[110px] h-8 text-xs" : "w-[140px]"} data-testid="select-language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((l) => (
            <SelectItem key={l.code} value={l.code} data-testid={`option-lang-${l.code}`}>
              {l.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
