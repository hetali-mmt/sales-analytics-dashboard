import { useState } from 'react'
import { User } from '@/schemas'

interface ExportProgress {
  isExporting: boolean
  progress: number
}

export function useTeamExport() {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0
  })

  const exportTeamReport = async (
    users: User[], 
    teamMetrics: any, 
    scoreTrends: any,
    filename = 'team-report'
  ) => {
    setExportProgress({ isExporting: true, progress: 0 })
    
    try {
      // Dynamic imports
      const jsPDFModule = await import('jspdf')
      const jsPDF = jsPDFModule.default
      const autoTable = (await import('jspdf-autotable')).default
      const html2canvas = (await import('html2canvas')).default
      
      setExportProgress(prev => ({ ...prev, progress: 10 }))
      
      const doc = new jsPDF()
      
      // Header with company branding
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, 210, 30, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('TEAM PERFORMANCE REPORT', 20, 20)
      
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
      doc.text(`Report Period: Last 30 Days`, 20, yPosition)
      yPosition += 15
      
      setExportProgress(prev => ({ ...prev, progress: 20 }))
      
      // Executive Summary
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Executive Summary', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      
      // Calculate metrics from actual user data
      const totalUsers = users.length
      const avgScore = users.reduce((sum, user) => sum + (user.avg_score || 0), 0) / totalUsers
      const totalSessions = users.reduce((sum, user) => sum + (user.total_sessions || 0), 0)
      const highPerformers = users.filter(user => (user.avg_score || 0) >= 7).length
      
      const summaryData = [
        ['Total Team Members', totalUsers.toString()],
        ['Average Team Score', avgScore.toFixed(1)],
        ['Total Sessions Completed', totalSessions.toString()],
        ['High Performers (≥7.0)', `${highPerformers} (${((highPerformers/totalUsers)*100).toFixed(1)}%)`]
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
      setExportProgress(prev => ({ ...prev, progress: 35 }))
      
      // Team Performance Chart
      const chartElement = document.querySelector('[data-chart="team-performance"]') as HTMLElement
      if (chartElement) {
        try {
          doc.setFontSize(16)
          doc.setFont('helvetica', 'bold')
          doc.text('Team Performance Overview', 20, yPosition)
          yPosition += 10
          
          const canvas = await html2canvas(chartElement, { 
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            logging: false
          })
          const imgData = canvas.toDataURL('image/png')
          
          const imgWidth = 170
          const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 100)
          
          if (yPosition + imgHeight > 270) {
            doc.addPage()
            yPosition = 20
          }
          
          doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 20
        } catch (error) {

          yPosition += 10
        }
      }
      
      setExportProgress(prev => ({ ...prev, progress: 55 }))
      
      // Top Performers Section
      if (yPosition + 80 > 270) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Top Performers', 20, yPosition)
      yPosition += 10
      
      const topPerformers = [...users]
        .sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0))
        .slice(0, 5)
      
      const topPerformersData = topPerformers.map((user, index) => [
        `#${index + 1}`,
        user.first_name || 'N/A',
        user.team || 'N/A',
        (user.avg_score || 0).toFixed(1),
        (user.total_sessions || 0).toString()
      ])
      
      autoTable(doc, {
        head: [['Rank', 'Name', 'Team', 'Avg Score', 'Sessions']],
        body: topPerformersData,
        startY: yPosition,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          3: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'center' }
        }
      })
      
      yPosition = (doc as any).lastAutoTable.finalY + 20
      setExportProgress(prev => ({ ...prev, progress: 75 }))
      
      // Complete Team Roster
      if (yPosition + 60 > 270) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Complete Team Roster', 20, yPosition)
      yPosition += 10
      
      const teamData = users.map(user => [
        user.first_name || 'N/A',
        user.team || 'N/A',
        (user.total_sessions || 0).toString(),
        (user.avg_score || 0).toFixed(1),
        user.recent_trend || 'stable'
      ])
      
      autoTable(doc, {
        head: [['Name', 'Team', 'Sessions', 'Avg Score', 'Trend']],
        body: teamData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'center' }
        },
        alternateRowStyles: { fillColor: [248, 249, 250] }
      })
      
      setExportProgress(prev => ({ ...prev, progress: 90 }))
      
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages()
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
        setExportProgress({ isExporting: false, progress: 0 })
      }, 1000)
    } catch (error) {
      console.error('PDF export failed:', error)
      setExportProgress({ isExporting: false, progress: 0 })
    }
  }

  return {
    exportProgress,
    exportTeamReport
  }
}