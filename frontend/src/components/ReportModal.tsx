import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSpreadsheet, FileText, CheckSquare, Square, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Fix for jspdf-autotable typing in some environments
interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
}

const COLUMNS = [
  { id: 'name', label: 'Nombre' },
  { id: 'paternal_name', label: 'Apellido Paterno' },
  { id: 'maternal_name', label: 'Apellido Materno' },
  { id: 'date_of_birth', label: 'Fecha de Nacimiento' },
  { id: 'phone', label: 'Teléfono' },
  { id: 'email', label: 'Correo Institucional' },
  { id: 'secretary', label: 'Secretaría / Dependencia' },
  { id: 'position', label: 'Cargo / Puesto' },
  { id: 'social_media', label: 'Redes Sociales' },
  { id: 'zip_code', label: 'Código Postal' },
  { id: 'address', label: 'Domicilio Detallado' },
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, data }) => {
  const [selectedCols, setSelectedCols] = useState<string[]>(COLUMNS.map(c => c.id));
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');

  const toggleColumn = (id: string) => {
    if (selectedCols.includes(id)) {
      setSelectedCols(selectedCols.filter(c => c !== id));
    } else {
      setSelectedCols([...selectedCols, id]);
    }
  };

  const selectAll = () => setSelectedCols(COLUMNS.map(c => c.id));
  const selectNone = () => setSelectedCols([]);

  const handleExport = () => {
    if (selectedCols.length === 0) return alert('Por favor selecciona al menos una columna.');

    const reportData = data.map(item => {
      const row: any = {};
      selectedCols.forEach(colId => {
        const col = COLUMNS.find(c => c.id === colId);
        if (col) row[col.label] = item[colId] || 'N/A';
      });
      return row;
    });

    if (format === 'excel') {
      exportToExcel(reportData);
    } else {
      exportToPDF(reportData);
    }
  };

  const exportToExcel = (reportData: any[]) => {
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registros QSD");
    XLSX.writeFile(wb, `Reporte_QSD_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = (reportData: any[]) => {
    const doc = new jsPDF({ orientation: 'landscape' }) as jsPDFWithPlugin;
    
    // Header text
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55); // Gold color
    doc.text('Reporte Oficial de Ciudadanos - QSD', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total de registros: ${reportData.length}`, 14, 35);

    const headers = [selectedCols.map(id => COLUMNS.find(c => c.id === id)?.label)];
    const rows = reportData.map(row => Object.values(row));

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 45,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [212, 175, 55], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`Reporte_QSD_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} 
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="glass-panel"
            style={{ width: '100%', maxWidth: '700px', padding: '2.5rem', position: 'relative', backgroundColor: '#fff', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <button onClick={onClose} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Generación de Reportes</h3>
              <p style={{ color: 'var(--text-muted)' }}>Seleccione el formato y las columnas que desea incluir en el documento oficial.</p>
            </div>

            {/* Format Selection */}
            <div style={{ marginBottom: '2.5rem' }}>
              <label className="form-label" style={{ marginBottom: '1rem' }}>Formato de Salida</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setFormat('excel')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '16px', border: format === 'excel' ? '2px solid var(--gold-opaque)' : '1px solid rgba(0,0,0,0.1)', background: format === 'excel' ? 'rgba(212,175,55,0.05)' : 'transparent', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  <FileSpreadsheet size={32} color={format === 'excel' ? 'var(--gold-opaque)' : '#6c757d'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: format === 'excel' ? 'var(--gold-opaque)' : 'var(--text-main)' }}>Microsoft Excel</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Formato .xlsx editable</div>
                  </div>
                </button>

                <button 
                  onClick={() => setFormat('pdf')}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '1.5rem', borderRadius: '16px', border: format === 'pdf' ? '2px solid var(--gold-opaque)' : '1px solid rgba(0,0,0,0.1)', background: format === 'pdf' ? 'rgba(212,175,55,0.05)' : 'transparent', cursor: 'pointer', transition: 'all 0.3s' }}
                >
                  <FileText size={32} color={format === 'pdf' ? 'var(--gold-opaque)' : '#6c757d'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: format === 'pdf' ? 'var(--gold-opaque)' : 'var(--text-main)' }}>Documento PDF</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Formato oficial listo para impresión</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Column Selection */}
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Columnas a incluir</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={selectAll} style={{ background: 'none', border: 'none', color: 'var(--gold-opaque)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>Seleccionar Todo</button>
                  <button onClick={selectNone} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>Ninguno</button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '16px' }}>
                {COLUMNS.map(col => (
                  <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    <div onClick={(e) => { e.preventDefault(); toggleColumn(col.id); }}>
                      {selectedCols.includes(col.id) ? (
                        <CheckSquare size={20} color="var(--gold-opaque)" fill="rgba(212,175,55,0.1)" />
                      ) : (
                        <Square size={20} color="rgba(0,0,0,0.2)" />
                      )}
                    </div>
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button 
              onClick={handleExport}
              className="btn-primary"
              style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }}
            >
              <Download size={20} /> Generar y Descargar Reporte
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
