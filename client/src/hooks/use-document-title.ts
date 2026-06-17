import { useEffect } from "react";

const BASE = "WealthSync AI";

export function useDocumentTitle(title?: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} · ${BASE}` : BASE;
    let metaDesc: HTMLMetaElement | null = null;
    let prevDesc: string | null = null;
    if (description) {
      metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        prevDesc = metaDesc.getAttribute("content");
        metaDesc.setAttribute("content", description);
      }
    }
    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc !== null) metaDesc.setAttribute("content", prevDesc);
    };
  }, [title, description]);
}
