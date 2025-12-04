import { useState } from 'react'
import { Session } from '@/schemas'

interface ExportProgress {
  isExporting: boolean
  progress: number
  type: 'csv' | 'pdf' | null
}

export function useExport() {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    type: null
  })

  const exportToCSV = async (sessions: Session[], filename = 'sessions') => {
    setExportProgress({ isExporting: true, progress: 0, type: 'csv' })
    
    try {
      // Simulate progress
      setExportProgress(prev => ({ ...prev, progress: 25 }))
      
      const headers = ['ID', 'Title', 'Score', 'Team', 'Created At', 'Feedback']
      const csvContent = [
        headers.join(','),
        ...sessions.map(session => [
          session.id,
          `"${session.title.replace(/"/g, '""')}"`,
          session.score,
          session.team || '',
          new Date(session.created_at).toISOString(),
          `"${(session.feedback || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n')
      
      setExportProgress(prev => ({ ...prev, progress: 75 }))
      
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.csv`
      link.click()
      URL.revokeObjectURL(url)
      
      setExportProgress(prev => ({ ...prev, progress: 100 }))
      
      setTimeout(() => {
        setExportProgress({ isExporting: false, progress: 0, type: null })
      }, 1000)
    } catch (error) {
      console.error('CSV export failed:', error)
      setExportProgress({ isExporting: false, progress: 0, type: null })
    }
  }

  const exportToPDF = async (sessions: Session[], chartData?: any, filename = 'sessions-report') => {
    setExportProgress({ isExporting: true, progress: 0, type: 'pdf' })
    
    try {
      // Dynamic import for PDF generation
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      
      setExportProgress(prev => ({ ...prev, progress: 10 }))
      
      const doc = new jsPDF()
      
      // Header with company branding
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 210, 30, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('SESSIONS ANALYSIS REPORT', 20, 20)
      
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      
      let yPosition = 45
      
      // Report metadata
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`, 20, yPosition)
      yPosition += 8
      doc.text(`Total Sessions Analyzed: ${sessions.length}`, 20, yPosition)
      yPosition += 15
      
      setExportProgress(prev => ({ ...prev, progress: 25 }))
      
      // Executive Summary
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Executive Summary', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      
      // Calculate metrics from actual session data
      const totalSessions = sessions.length
      const avgScore = sessions.reduce((sum, s) => sum + s.score, 0) / totalSessions
      const highScoreSessions = sessions.filter(s => s.score >= 7).length
      const lowScoreSessions = sessions.filter(s => s.score < 5).length
      const avgConfidence = sessions.reduce((sum, s) => sum + (s.metrics?.confidence || 0), 0) / totalSessions
      const avgClarity = sessions.reduce((sum, s) => sum + (s.metrics?.clarity || 0), 0) / totalSessions
      
      const summaryData = [
        ['Total Sessions', totalSessions.toString()],
        ['Average Score', avgScore.toFixed(1)],
        ['High Performers (≥7.0)', `${highScoreSessions} (${((highScoreSessions/totalSessions)*100).toFixed(1)}%)`],
        ['Needs Improvement (<5.0)', `${lowScoreSessions} (${((lowScoreSessions/totalSessions)*100).toFixed(1)}%)`],
        ['Average Confidence', avgConfidence.toFixed(1)],
        ['Average Clarity', avgClarity.toFixed(1)]
      ]
      
      autoTable(doc, {
        body: summaryData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 11, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [248, 249, 250] },
          1: { halign: 'right' }
        }
      })
      
      yPosition = (doc as any).lastAutoTable.finalY + 20
      setExportProgress(prev => ({ ...prev, progress: 45 }))
      
      // Top Performing Sessions
      if (yPosition + 80 > 270) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Top Performing Sessions', 20, yPosition)
      yPosition += 10
      
      const topSessions = [...sessions]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
      
      const topSessionsData = topSessions.map((session, index) => [
        `#${index + 1}`,
        session.title.length > 30 ? session.title.substring(0, 30) + '...' : session.title,
        session.score.toFixed(1),
        new Date(session.created_at).toLocaleDateString(),
        session.user_id.slice(-6)
      ])
      
      autoTable(doc, {
        head: [['Rank', 'Session Title', 'Score', 'Date', 'User ID']],
        body: topSessionsData,
        startY: yPosition,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          1: { cellWidth: 80 },
          2: { halign: 'center', fontStyle: 'bold', cellWidth: 25 },
          3: { halign: 'center', cellWidth: 30 },
          4: { halign: 'center', cellWidth: 25 }
        }
      })
      
      yPosition = (doc as any).lastAutoTable.finalY + 20
      setExportProgress(prev => ({ ...prev, progress: 65 }))
      
      // Complete Sessions List
      if (yPosition + 60 > 270) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Complete Sessions List', 20, yPosition)
      yPosition += 10
      
      const sessionData = sessions.map(session => [
        session.title.length > 25 ? session.title.substring(0, 25) + '...' : session.title,
        session.score.toFixed(1),
        (session.metrics?.confidence || 0).toFixed(1),
        (session.metrics?.clarity || 0).toFixed(1),
        new Date(session.created_at).toLocaleDateString(),
        session.user_id.slice(-6)
      ])
      
      autoTable(doc, {
        head: [['Title', 'Score', 'Confidence', 'Clarity', 'Date', 'User']],
        body: sessionData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
          2: { halign: 'center', cellWidth: 25 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 30 },
          5: { halign: 'center', cellWidth: 20 }
        },
        alternateRowStyles: { fillColor: [248, 249, 250] }
      })
      
      setExportProgress(prev => ({ ...prev, progress: 85 }))
      
      // Footer
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' })
        doc.text('Confidential - Internal Use Only', 20, 285)
      }
      
      setExportProgress(prev => ({ ...prev, progress: 100 }))
      
      doc.save(`${filename}.pdf`)
      
      setTimeout(() => {
        setExportProgress({ isExporting: false, progress: 0, type: null })
      }, 1000)
    } catch (error) {
      console.error('PDF export failed:', error)
      setExportProgress({ isExporting: false, progress: 0, type: null })
    }
  }

  return {
    exportProgress,
    exportToCSV,
    exportToPDF
  }
}