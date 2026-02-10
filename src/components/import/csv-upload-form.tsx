"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createImportBatch, parseImportBatch } from "@/actions/vendor-import";

export function CsvUploadForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [csvText, setCsvText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  const handleSubmit = () => {
    if (!csvText.trim()) {
      toast.error("Please provide CSV data");
      return;
    }

    startTransition(async () => {
      const createResult = await createImportBatch(selectedFile?.name);
      if (!createResult.success || !createResult.data) {
        toast.error(createResult.error || "Failed to create batch");
        return;
      }

      const batchId = createResult.data.batchId;

      const parseResult = await parseImportBatch(batchId, csvText);
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

        <div className="mt-6">
          <Button
            onClick={handleSubmit}
            disabled={isPending || !csvText.trim()}
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
