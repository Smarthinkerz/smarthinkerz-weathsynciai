import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import i18n from '@/lib/i18n';

const SUPPORTED_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
  { value: 'ar', label: 'العربية' }
];

const SUPPORTED_CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CNY', label: 'Chinese Yuan (¥)' },
  { value: 'AED', label: 'UAE Dirham (د.إ)' }
];

const formSchema = z.object({
  preferredLanguage: z.string(),
  preferredCurrency: z.string(),
  preferredRegion: z.string().optional(),
});

type RegionalSettingsFormData = z.infer<typeof formSchema>;

interface RegionalSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    preferredLanguage: string;
    preferredCurrency: string;
    preferredRegion?: string;
  };
}

export function RegionalSettings({ open, onOpenChange, initialValues }: RegionalSettingsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const form = useForm<RegionalSettingsFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preferredLanguage: initialValues?.preferredLanguage || 'en',
      preferredCurrency: initialValues?.preferredCurrency || 'USD',
      preferredRegion: initialValues?.preferredRegion,
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: RegionalSettingsFormData) => {
      const res = await apiRequest("PATCH", "/api/user/settings", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update settings");
      }
      return res.json();
    }
  });

  const onSubmit = async (data: RegionalSettingsFormData) => {
    try {
      // Save settings to backend first
      await updateSettingsMutation.mutateAsync(data);

      // Invalidate user query cache
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      // Handle language change if needed
      if (data.preferredLanguage && data.preferredLanguage !== i18n.language) {
        console.log("Current language:", i18n.language);
        console.log("Changing to:", data.preferredLanguage);

        // Update direction first
        document.documentElement.dir = data.preferredLanguage === 'ar' ? 'rtl' : 'ltr';

        // Show success message before language change
        toast({
          title: t('settingsUpdated'),
          description: t('settingsUpdatedDescription'),
        });

        // Close dialog before reload
        onOpenChange(false);

        // Change language and reload
        await i18n.changeLanguage(data.preferredLanguage);
        window.location.reload();
      } else {
        // For non-language changes
        toast({
          title: t('settingsUpdated'),
          description: t('settingsUpdatedDescription'),
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Settings update failed:", error);
      toast({
        title: t('settingsUpdateFailed'),
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('regionalSettings')}</DialogTitle>
          <DialogDescription>
            {t('settingsUpdatedDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="preferredLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('language')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectLanguage')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferredCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('currency')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCurrency')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? t('updating') : t('updateSettings')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}