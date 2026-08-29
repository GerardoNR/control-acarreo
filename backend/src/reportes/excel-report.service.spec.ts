import ExcelJS from 'exceljs';
import { ExcelReportService } from './excel-report.service';
import { VIAJE_REPORTE_HEADERS } from './viaje-reporte.mapper';

describe('ExcelReportService', () => {
  it('genera una sola hoja filtrable con encabezado congelado y formatos', async () => {
    const values = Array.from({ length: 36 }, (_, i) =>
      i === 6
        ? '260828237521757501703'
        : i === 1
          ? new Date('2026-08-28T13:45:57Z')
          : i === 2
            ? new Date('2026-08-28T13:45:57Z')
            : i === 5
              ? 1 / 24
              : i === 24
                ? 628.29
                : 'N/A',
    );
    const buffer = await new ExcelReportService().generar([values]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Worksheet');
    expect(workbook.worksheets).toHaveLength(1);
    expect(sheet?.getRow(1).values.slice(1)).toEqual([
      ...VIAJE_REPORTE_HEADERS,
    ]);
    expect(sheet?.autoFilter).toEqual('A1:AJ1');
    expect(sheet?.views[0]).toMatchObject({ state: 'frozen', xSplit: 1, ySplit: 1 });
    expect(sheet?.getCell('G2').value).toBe('260828237521757501703');
    expect(sheet?.getCell('G2').numFmt).toBe('@');
    expect(sheet?.getCell('Y2').numFmt).toBe('#,##0.00');
    expect(sheet?.getRow(2).height).toBe(20);
    expect(sheet?.getCell('A2').border).toMatchObject({
      top: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
    });
  });
});
