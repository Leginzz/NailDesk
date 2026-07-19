// ============================================================
// NailDesk — Export to Excel Utility (uses SheetJS/xlsx)
// ============================================================

/**
 * Export data array to .xlsx file
 * @param {Array<Object>} data - Array of objects to export
 * @param {string} filename - Filename without extension
 * @param {Array<{header: string, key: string, width?: number}>} columns - Column definitions
 */
export function exportToExcel(data, filename, columns = null) {
  if (!window.XLSX) {
    console.error('SheetJS (xlsx) not loaded');
    return;
  }

  const ws = XLSX.utils.json_to_sheet(data, columns ? { header: columns.map(c => c.header) } : undefined);

  if (columns) {
    ws['!cols'] = columns.map(c => ({ wch: c.width || 15 }));
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  XLSX.writeFile(wb, filename + '.xlsx');
}

/**
 * Export data with custom header mapping
 * @param {Array<Object>} data - Source data
 * @param {string} filename - Filename without extension
 * @param {Object} headerMap - { "Header Label": "source_key" }
 * @param {Object} options - { widths: { "Header Label": number } }
 */
export function exportWithHeaders(data, filename, headerMap, options = {}) {
  const headers = Object.keys(headerMap);
  const keys = Object.values(headerMap);

  const mappedData = data.map(row => {
    const newRow = {};
    headers.forEach((h, i) => {
      newRow[h] = row[keys[i]] ?? '';
    });
    return newRow;
  });

  const columns = headers.map(h => ({
    header: h,
    key: h,
    width: options.widths?.[h] || 15
  }));

  exportToExcel(mappedData, filename, columns);
}
