'use client'

import { Button } from "@/components/ui/button"
import html2pdf from 'html2pdf.js'
import { type Editor } from '@tiptap/react'

interface PDFExportButtonProps {
  editor: Editor | null
  flowchart: string
  isFlowchartReady: boolean
  setError: (error: string) => void
}

export default function PDFExportButton({ 
  editor, 
  flowchart, 
  isFlowchartReady,
  setError 
}: PDFExportButtonProps) {
  const handleExport = async () => {
    if (!isFlowchartReady) {
      console.log('Waiting for flowchart to render...');
      return;
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const mermaidContainer = document.querySelector('.mermaid');
      if (!mermaidContainer) {
        throw new Error('Flowchart container not found');
      }

      const flowchartElement = mermaidContainer.querySelector('svg');
      if (!flowchartElement) {
        throw new Error('Flowchart SVG not found');
      }

      // Clone the SVG and add necessary attributes
      const svgClone = flowchartElement.cloneNode(true) as SVGElement;
      svgClone.setAttribute('width', '1200');
      svgClone.setAttribute('height', '1200');
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Convert SVG to string and create image
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const imgData = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      
      // Create content for PDF
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
          ${editor?.getHTML() || ''}
          <div style="margin-top: 20px; page-break-before: always;">
            <h2 style="margin-bottom: 1rem;">Code Flowchart</h2>
            <img src="${imgData}" style="max-width: 100%; height: auto;" />
          </div>
        </div>
      `;

      const opt = {
        margin: 1,
        filename: 'documentation.pdf',
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 2,
          logging: false,
          useCORS: true
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(content).save();
      
    } catch (error) {
      console.error('Export error:', error);
      setError('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <Button onClick={handleExport}>
      Export to PDF
    </Button>
  );
}
