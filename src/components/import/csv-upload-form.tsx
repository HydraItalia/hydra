"use client";

import { useState, useRef, useTransition, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createImportBatch,
  parseImportBatch,
  suggestImportTemplate,
  createImportTemplate,
  getImportTemplate,
} from "@/actions/vendor-import";
import { TemplateSuggestionBanner } from "./template-suggestion-banner";
import { ColumnMappingEditor } from "./column-mapping-editor";
import {
  REQUIRED_CANONICAL_KEYS,
  buildTemplateMappingFromSelections,
} from "@/lib/import/canonical-fields";
import type { TemplateSuggestion, TemplateMapping } from "@/lib/import/catalog-csv";

export function CsvUploadForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [csvText, setCsvText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mapping state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState<TemplateSuggestion | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showMapping, setShowMapping] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  // Save as template
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // Track whether we've already suggested for this CSV content
  const lastSuggestedRef = useRef("");

  const allRequiredMapped = REQUIRED_CANONICAL_KEYS.every(
    (key) => !!selections[key],
  );
  const canSubmit =
    csvText.trim() &&
    allRequiredMapped &&
    (!saveAsTemplate || !!templateName.trim()) &&
    !isPending;

  const applyTemplateMapping = useCallback(
    (mapping: TemplateMapping, headers: string[]) => {
      const newSelections: Record<string, string> = {};
      for (const [canonicalField, config] of Object.entries(mapping)) {
        for (const source of config.sources) {
          const normalizedSource = source.toLowerCase().trim();
          const matched = headers.find(
            (h) => h.toLowerCase().trim() === normalizedSource,
          );
          if (matched) {
            newSelections[canonicalField] = matched;
            break;
          }
        }
      }
      setSelections(newSelections);
    },
    [],
  );

  const runSuggestion = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const fingerprint = text.split("\n")[0] || "";
      if (fingerprint === lastSuggestedRef.current) return;
      lastSuggestedRef.current = fingerprint;

      setSuggestLoading(true);
      setSuggestionDismissed(false);

      try {
        const result = await suggestImportTemplate(text);
        if (!result.success || !result.data) {
          if (result.error) toast.error(result.error);
          return;
        }

        const { suggestion: sug, headers } = result.data;
        setCsvHeaders(headers);
        setSuggestion(sug);

        if (sug?.autoApply && sug.templateId) {
          // Auto-apply: fetch the actual template mapping from the server
          const tmpl = await getImportTemplate(sug.templateId);
          if (tmpl.success && tmpl.data) {
            applyTemplateMapping(tmpl.data.mapping, headers);
            setShowMapping(false); // collapsed for auto-apply
          } else {
            setShowMapping(true);
          }
        } else if (sug) {
          setShowMapping(true);
        } else {
          // No suggestion — auto-match canonical headers
          autoMatchHeaders(headers);
          setShowMapping(true);
        }
      } finally {
        setSuggestLoading(false);
      }
    },
    [applyTemplateMapping],
  );

  // Auto-match: if CSV headers already use canonical names, pre-select them
  const autoMatchHeaders = (headers: string[]) => {
    const knownCanonical = [
      "name",
      "category",
      "price_cents",
      "unit",
      "in_stock",
      "product_code",
    ];
    const auto: Record<string, string> = {};
    for (const canonical of knownCanonical) {
      const normalized = canonical.toLowerCase().replace(/_/g, " ");
      const matched = headers.find((h) => {
        const n = h.toLowerCase().replace(/[_\-.]/g, " ").trim();
        return n === normalized;
      });
      if (matched) {
        auto[canonical] = matched;
      }
    }
    setSelections(auto);
  };

  // Trigger suggestion when CSV text settles (debounced via effect)
  useEffect(() => {
    if (!csvText.trim()) {
      setCsvHeaders([]);
      setSuggestion(null);
      setSelections({});
      setShowMapping(false);
      lastSuggestedRef.current = "";
      return;
    }

    const timer = setTimeout(() => {
      runSuggestion(csvText);
    }, 500);
    return () => clearTimeout(timer);
  }, [csvText, runSuggestion]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      lastSuggestedRef.current = "";
      setSuggestionDismissed(false);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setCsvText(text);
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setSelectedFile(null);
      };
      reader.readAsText(file);
    }
  };

  const handleApplySuggestion = async (templateId: string) => {
    // When user clicks "Apply" or "Change", expand the mapping editor
    // and fetch the template to populate selections
    setShowMapping(true);

    if (!suggestion) return;

    const result = await getImportTemplate(templateId);
    if (result.success && result.data) {
      applyTemplateMapping(result.data.mapping, csvHeaders);
    }
  };

  const handleDismissSuggestion = () => {
    setSuggestionDismissed(true);
    setShowMapping(true);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (saveAsTemplate && !templateName.trim()) {
      toast.error("Template name is required to save a template");
      return;
    }

    startTransition(async () => {
      // Optionally save as template first
      let templateId: string | undefined;
      if (saveAsTemplate && templateName.trim()) {
        const mapping = buildTemplateMappingFromSelections(selections);
        const tmplResult = await createImportTemplate(templateName.trim(), mapping);
        if (!tmplResult.success) {
          toast.error(tmplResult.error || "Failed to save template");
          return;
        }
        templateId = tmplResult.data?.id;
        toast.success(`Template "${templateName.trim()}" saved`);
      }

      const createResult = await createImportBatch(selectedFile?.name);
      if (!createResult.success || !createResult.data) {
        toast.error(createResult.error || "Failed to create batch");
        return;
      }

      const batchId = createResult.data.batchId;

      // Build parse opts with mapping
      const mappingOverride = buildTemplateMappingFromSelections(selections);
      const hasMapping = Object.keys(mappingOverride).length > 0;

      const parseResult = await parseImportBatch(batchId, csvText, {
        ...(templateId ? { templateId } : {}),
        ...(hasMapping && !templateId ? { mappingOverride } : {}),
      });
      if (!parseResult.success) {
        toast.error(parseResult.error || "Failed to parse CSV");
        return;
      }

      toast.success(`Parsed ${parseResult.data?.rowCount} rows`);
      router.push(`/dashboard/vendor/import/${batchId}`);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import CSV Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file" className="space-y-4">
          <TabsList>
            <TabsTrigger value="file">
              <Upload className="h-4 w-4 mr-2" />
              File Upload
            </TabsTrigger>
            <TabsTrigger value="paste">
              <FileText className="h-4 w-4 mr-2" />
              Paste
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {selectedFile
                  ? selectedFile.name
                  : "Click to select a CSV file"}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                {csvText.split("\n").filter((line) => line.trim()).length - 1}{" "}
                data lines detected
              </p>
            )}
          </TabsContent>

          <TabsContent value="paste" className="space-y-4">
            <Textarea
              placeholder={`Paste your CSV data here...\n\nExpected columns: name, category, unit, price_cents, in_stock, product_code`}
              rows={12}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setSelectedFile(null);
              }}
              className="font-mono text-sm"
            />
          </TabsContent>
        </Tabs>

        {/* Template suggestion banner */}
        {csvHeaders.length > 0 && !suggestionDismissed && (
          <div className="mt-4">
            <TemplateSuggestionBanner
              suggestion={suggestion}
              loading={suggestLoading}
              onApply={handleApplySuggestion}
              onDismiss={handleDismissSuggestion}
            />
          </div>
        )}

        {/* Column mapping editor */}
        {csvHeaders.length > 0 && (
          <div className="mt-4 space-y-3">
            <button
              type="button"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowMapping(!showMapping)}
            >
              {showMapping ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Column Mapping
              {!allRequiredMapped && (
                <span className="text-xs text-red-500 ml-2">
                  (required fields missing)
                </span>
              )}
            </button>

            {showMapping && (
              <div className="rounded-lg border p-4 space-y-4">
                <ColumnMappingEditor
                  csvHeaders={csvHeaders}
                  selections={selections}
                  onChange={setSelections}
                  showUnmapped
                />

                {/* Save as template */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="save-template"
                      checked={saveAsTemplate}
                      onCheckedChange={(v) => setSaveAsTemplate(v === true)}
                    />
                    <Label htmlFor="save-template" className="text-sm">
                      Save this mapping as a template
                    </Label>
                  </div>
                  {saveAsTemplate && (
                    <Input
                      placeholder="Template name (e.g. Italian supplier format)"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="max-w-sm"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full sm:w-auto"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Processing..." : "Upload & Parse"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
