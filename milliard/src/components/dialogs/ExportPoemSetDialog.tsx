import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, FileText, FileType } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportPoemSetDialogProps {
  title: string;
  sonnets: string[];
}

export function ExportPoemSetDialog({ title, sonnets }: ExportPoemSetDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const generateTextContent = () => {
    let content = `${title}\n`;
    content += "=".repeat(title.length) + "\n\n";

    sonnets.forEach((sonnet, index) => {
      if (sonnet.trim()) {
        content += `Sonnet ${index + 1}\n`;
        content += "-".repeat(20) + "\n";
        content += sonnet + "\n\n";
      }
    });

    return content;
  };

  const downloadAsText = () => {
    const content = generateTextContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Your poem set has been downloaded as a text file",
    });
    setOpen(false);
  };

  const downloadAsPDF = async () => {
    try {
      // Dynamic import of jspdf
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - (2 * margin);
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Sonnets
      doc.setFontSize(12);
      sonnets.forEach((sonnet, index) => {
        if (sonnet.trim()) {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }

          // Sonnet number
          doc.setFont(undefined, 'bold');
          doc.text(`Sonnet ${index + 1}`, margin, yPosition);
          yPosition += 8;
          doc.setFont(undefined, 'normal');

          // Sonnet lines
          const lines = sonnet.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            // Check if we need a new page
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }

            const splitLines = doc.splitTextToSize(line, maxWidth);
            doc.text(splitLines, margin, yPosition);
            yPosition += 6 * splitLines.length;
          });

          yPosition += 10;
        }
      });

      doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);

      toast({
        title: "Downloaded",
        description: "Your poem set has been downloaded as a PDF",
      });
      setOpen(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try another format.",
        variant: "destructive",
      });
    }
  };

  const downloadAsDocx = async () => {
    try {
      // Dynamic import of docx
      const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = await import('docx');

      const children: any[] = [];

      // Title
      children.push(
        new Paragraph({
          text: title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // Sonnets
      sonnets.forEach((sonnet, index) => {
        if (sonnet.trim()) {
          // Sonnet number
          children.push(
            new Paragraph({
              text: `Sonnet ${index + 1}`,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 },
            })
          );

          // Sonnet lines
          const lines = sonnet.split('\n').filter(line => line.trim());
          lines.forEach(line => {
            children.push(
              new Paragraph({
                children: [new TextRun(line)],
                spacing: { after: 100 },
              })
            );
          });

          // Space between sonnets
          children.push(
            new Paragraph({
              text: "",
              spacing: { after: 200 },
            })
          );
        }
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: "Your poem set has been downloaded as a Word document",
      });
      setOpen(false);
    } catch (error) {
      console.error('DOCX generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate Word document. Please try another format.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Save As
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Poem Set</DialogTitle>
          <DialogDescription>
            Download your sonnets in your preferred format
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={downloadAsText}
          >
            <FileText className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Plain Text (.txt)</div>
              <div className="text-xs text-muted-foreground">Simple text file, compatible with any device</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={downloadAsPDF}
          >
            <FileType className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">PDF Document (.pdf)</div>
              <div className="text-xs text-muted-foreground">Formatted document, preserves layout</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4"
            onClick={downloadAsDocx}
          >
            <FileType className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Word Document (.docx)</div>
              <div className="text-xs text-muted-foreground">Editable Microsoft Word format</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
