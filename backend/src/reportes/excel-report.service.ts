import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  VIAJE_REPORTE_HEADERS,
  ReporteViajeValue,
} from './viaje-reporte.mapper';

@Injectable()
export class ExcelReportService {
  async generar(rows: ReporteViajeValue[][]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'INDI';
    const sheet = workbook.addWorksheet('Worksheet', {
      views: [{ state: 'frozen', xSplit: 1, ySplit: 1, topLeftCell: 'B2' }],
    });
    sheet.addRow([...VIAJE_REPORTE_HEADERS]);
    const header = sheet.getRow(1);
    header.height = 32;
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A5F' },
    };
    header.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    header.eachCell((cell) => {
      cell.border = this.thinBorder();
    });
    rows.forEach((values) => sheet.addRow(values));
    for (let row = 2; row <= sheet.rowCount; row++) {
      const current = sheet.getRow(row);
      current.height = 20;
      current.font = { name: 'Calibri', size: 10 };
      current.alignment = { vertical: 'middle', wrapText: true };
      current.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = this.thinBorder();
      });
      [11, 14, 17, 30].forEach((column) => {
        current.getCell(column).alignment = { vertical: 'middle', wrapText: true };
      });
      [2, 4].forEach((column) => {
        current.getCell(column).numFmt = 'dd/mm/yyyy';
      });
      [3, 5].forEach((column) => {
        current.getCell(column).numFmt = 'hh:mm:ss';
      });
      current.getCell(6).numFmt = '[h]:mm:ss';
      [16, 18, 19, 20].forEach((column) => {
        current.getCell(column).numFmt = '0.000';
      });
      [21, 22, 23, 24, 25].forEach((column) => {
        current.getCell(column).numFmt = '#,##0.00';
      });
      [7, 8].forEach((column) => {
        current.getCell(column).numFmt = '@';
      });
    }
    sheet.autoFilter = { from: 'A1', to: `AJ1` };
    sheet.columns.forEach((column, index) => {
      column.width = this.width(index);
    });
    sheet.pageSetup.orientation = 'landscape';
    sheet.pageSetup.paperSize = 1 as ExcelJS.PaperSize;
    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageSetup.fitToHeight = 0;
    sheet.pageSetup.margins = {
      left: 0.4,
      right: 0.4,
      top: 0.6,
      bottom: 0.6,
      header: 0.25,
      footer: 0.25,
    };
    sheet.pageSetup.printTitlesRow = '1:1';
    sheet.pageSetup.printArea = `A1:AJ${Math.max(sheet.rowCount, 1)}`;
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private width(index: number): number {
    const widths = [
      28, 13, 12, 13, 12, 15, 20, 20, 14, 26, 30, 14, 26, 30, 14, 16, 34, 18,
      16, 14, 18, 22, 18, 22, 24, 24, 24, 22, 22, 38, 20, 20, 22, 24, 18, 18,
    ];
    return widths[index] ?? 18;
  }

  private thinBorder(): Partial<ExcelJS.Borders> {
    const side: Partial<ExcelJS.Border> = {
      style: 'thin',
      color: { argb: 'FFD1D5DB' },
    };
    return { top: side, left: side, bottom: side, right: side };
  }
}
