'use client'

import { useState, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import html2pdf from 'html2pdf.js'
import { DocumentToolbar } from './components/DocumentToolbar'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from 'lucide-react'
import Mermaid from './components/Mermaid'

export default function DocumentMaker() {
  const [code, setCode] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [flowchart, setFlowchart] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isFlowchartReady, setIsFlowchartReady] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: '',  // Start with empty content
    editable: true,
  })

  // Add this useEffect to update editor content
  useEffect(() => {
    if (editor && generatedContent) {
      editor.commands.setContent(generatedContent)
    }
  }, [editor, generatedContent])

  // Add handler for Mermaid render completion
  const handleMermaidRender = useCallback(() => {
    console.log('Mermaid chart rendered');
    setIsFlowchartReady(true);
  }, []);

  // Reset flowchart ready state when generating new content
  const handleGenerate = async () => {
    setIsFlowchartReady(false);
    if (!code.trim()) {
      setError('Please enter some code to analyze')
      return
    }

    setError('')
    setIsLoading(true)
    setGeneratedContent('')
    setFlowchart('')
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const data = await response.json()

      if (!data.content || !data.flowchart) {
        throw new Error('Invalid response format from server')
      }

      setGeneratedContent(data.content)
      setFlowchart(data.flowchart)
    } catch (error) {
      console.error('Generation error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = useCallback(async () => {
    console.log('Export function called');
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

      let flowchartImage = '';
      
      // Clone the SVG and add necessary attributes
      const svgClone = flowchartElement.cloneNode(true) as SVGElement;
      svgClone.setAttribute('width', '800');
      svgClone.setAttribute('height', '600');
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      // Convert SVG to string with XML declaration
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      
      // Create object URL and image
      flowchartImage = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 800;
          canvas.height = 600;
          
          // Add white background
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load SVG'));
        // Set crossOrigin to anonymous
        img.crossOrigin = 'anonymous';
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
      });

      // Create content for PDF
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
          ${editor?.getHTML() || ''}
          ${flowchartImage ? `
            <div style="margin-top: 20px; page-break-before: always;">
              <h2 style="margin-bottom: 1rem;">Code Flowchart</h2>
              <img src="${flowchartImage}" style="max-width: 100%; height: auto;" />
            </div>
          ` : ''}
        </div>
      `;

      const opt = {
        margin: 1,
        filename: 'documentation.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          logging: false,
          useCORS: true
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(content).save();
    } catch (error) {
      console.error('Detailed export error:', error); // Enhanced error logging
      setError('Failed to generate PDF');
    }
  }, [editor, flowchart, isFlowchartReady]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Document Maker</h1>
        <p className="text-muted-foreground">
          Generate documentation and flowcharts from your code
        </p>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Input Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your code here..."
              className="min-h-[400px] font-mono"
            />
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleGenerate} 
              disabled={isLoading || !code.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Documentation...
                </>
              ) : (
                'Generate Document'
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Generated Documentation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DocumentToolbar editor={editor} onExport={handleExport} />
            <div className="prose prose-sm dark:prose-invert max-w-none h-[400px] overflow-y-auto p-4">
              {generatedContent ? (
                <EditorContent editor={editor} />
              ) : (
                <div className="text-muted-foreground text-center h-full flex items-center justify-center">
                  Documentation will appear here after generation
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {flowchart && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Code Flowchart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Mermaid chart={flowchart} onRender={handleMermaidRender} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

