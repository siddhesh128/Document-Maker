'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface MermaidProps {
  chart: string;
  onRender?: () => void;  // Add this prop
}

export default function Mermaid({ chart, onRender }: MermaidProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string>('')

  const preprocessChart = (input: string) => {
    // Clean input and handle newlines
    input = input
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .trim()

    // Ensure proper line breaks and indentation
    const lines = input
      .split('\n')
      .map(line => {
        line = line.trim()
        
        // Don't modify the graph declaration
        if (line.startsWith('graph')) return line

        // Handle node definitions and connections
        return line
          .replace(/\[([^\]]+)\]/g, '[$1]') // Clean up node labels
          .replace(/-->\|([^|]+)\|/g, ' -->|$1|') // Fix arrow labels
          .replace(/\s+/g, ' ') // Clean up spaces
          .trim()
      })
      .filter(Boolean)

    return lines.join('\n')
  }

  useEffect(() => {
    mermaid.initialize({ 
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        curve: 'linear',
        padding: 10,
        nodeSpacing: 30,
        rankSpacing: 30,
        htmlLabels: true,
        useMaxWidth: true
      }
    })

    const renderChart = async () => {
      if (!mermaidRef.current) return
      
      try {
        setError('')
        const id = 'mermaid-' + Math.random().toString(36).substr(2, 9)
        const { svg } = await mermaid.render(id, chart)
        
        mermaidRef.current.innerHTML = svg
        
        const svgElement = mermaidRef.current.querySelector('svg')
        if (svgElement) {
          svgElement.style.width = '100%'
          svgElement.style.maxWidth = '800px'
          svgElement.style.margin = '0 auto'
          onRender?.() // Call the callback when rendering is complete
        }
      } catch (err) {
        console.error('Failed to render diagram:', err)
        setError(
          err instanceof Error 
            ? err.message 
            : 'Failed to render diagram. Please check the syntax.'
        )
      }
    }

    renderChart()
  }, [chart, onRender])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <div ref={mermaidRef} className="mermaid flex justify-center max-w-4xl mx-auto" />
    </div>
  )
}

